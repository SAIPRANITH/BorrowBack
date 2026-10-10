import mongoose from 'mongoose';
import Borrow from '../models/Borrow.js';
import Item from '../models/Item.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { calculateFine } from '../utils/fineCalculator.js';
import { transitionFinePaymentStatus } from '../utils/finePaymentWorkflow.js';
import { reconcileLentItems } from '../utils/itemAvailability.js';
import {
  isDepositReadyForAcceptance,
  resolveDepositStatus,
  transitionDepositStatus,
} from '../utils/depositWorkflow.js';

const updateOverdueBorrows = async (userId) => {
  await Borrow.updateMany(
    {
      $or: [{ borrower: userId }, { owner: userId }],
      status: 'active',
      dueDate: { $lt: new Date() },
    },
    { $set: { status: 'overdue' } }
  );
};

export const createBorrowRequest = async (req, res, next) => {
  try {
    const { dueDate } = req.body;
    const itemId = req.body.item?._id || req.body.item || req.body.itemId || req.body.id;

    if (!mongoose.isValidObjectId(itemId)) {
      res.status(400);
      throw new Error('A valid item must be selected');
    }

    const item = await Item.findById(itemId);

    if (!item) {
      res.status(404);
      throw new Error('Item not found');
    }

    const activeBorrow = await Borrow.findOne({
      item: itemId,
      status: { $in: ['active', 'overdue'] },
    });
    if (activeBorrow) {
      if (item.status !== 'lent') {
        item.status = 'lent';
        await item.save();
      }
      res.status(400);
      throw new Error('Item is already on loan and cannot accept a new request');
    }

    await reconcileLentItems([item]);

    if (item.status !== 'available') {
      res.status(400);
      throw new Error('Item is not available');
    }

    if (item.owner.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('Cannot borrow your own item');
    }

    const existingBorrow = await Borrow.findOne({
      item: itemId,
      borrower: req.user._id,
      status: { $in: ['pending', 'active', 'overdue'] },
    });

    if (existingBorrow) {
      res.status(400);
      throw new Error('You already have a pending or active request for this item');
    }

    const borrow = await Borrow.create({
      item: itemId,
      borrower: req.user._id,
      owner: item.owner,
      dueDate,
      depositAmount: item.depositAmount,
      depositStatus: Number(item.depositAmount) > 0 ? 'pending' : 'not_required',
    });

    await Notification.create({
      user: item.owner,
      borrow: borrow._id,
      message: `${req.user.name} has requested to borrow your item: ${item.name}`,
      type: 'request',
    });

    res.status(201).json({ success: true, borrow });
  } catch (error) {
    next(error);
  }
};

export const getIncomingRequests = async (req, res, next) => {
  try {
    const requests = await Borrow.find({
      owner: req.user._id,
      status: 'pending',
    })
      .populate('item')
      .populate('borrower', 'name email averageRating profilePhoto')
      .sort('-createdAt');

    res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    next(error);
  }
};

export const getMyBorrows = async (req, res, next) => {
  try {
    await updateOverdueBorrows(req.user._id);
    const borrows = await Borrow.find({ borrower: req.user._id })
      .populate('item')
      .populate('owner', 'name email averageRating profilePhoto')
      .sort('-createdAt');

    res.json({ success: true, count: borrows.length, borrows });
  } catch (error) {
    next(error);
  }
};

export const getLendingHistory = async (req, res, next) => {
  try {
    await updateOverdueBorrows(req.user._id);
    const history = await Borrow.find({ owner: req.user._id })
      .populate('item')
      .populate('borrower', 'name email averageRating profilePhoto')
      .sort('-createdAt');

    res.json({ success: true, count: history.length, history, borrows: history });
  } catch (error) {
    next(error);
  }
};

export const acceptRequest = async (req, res, next) => {
  try {
    const borrow = await Borrow.findById(req.params.id).populate('item');

    if (!borrow) {
      res.status(404);
      throw new Error('Borrow request not found');
    }

    if (borrow.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to accept this request');
    }

    if (borrow.status !== 'pending') {
      res.status(400);
      throw new Error('Can only accept pending requests');
    }

    if (!isDepositReadyForAcceptance(borrow)) {
      res.status(400);
      throw new Error(Number(borrow.depositAmount) > 0
        ? 'The deposit must be paid and confirmed before accepting this request'
        : 'This borrow request is not ready to be accepted');
    }

    const competingRequests = await Borrow.find({
      item: borrow.item._id,
      status: 'pending',
      _id: { $ne: borrow._id },
    });
    if (competingRequests.some((request) => resolveDepositStatus(request) === 'payment_pending')) {
      res.status(409);
      throw new Error('Resolve other reported deposit payments for this item before accepting a request');
    }

    await reconcileLentItems([borrow.item]);
    const item = await Item.findOneAndUpdate(
      { _id: borrow.item._id, status: 'available' },
      { $set: { status: 'lent' } },
      { new: true }
    );
    if (!item) {
      res.status(400);
      throw new Error('This item is no longer available');
    }

    const nextStatus = transitionDepositStatus(borrow, 'accept_request');
    const updatedBorrow = await Borrow.findOneAndUpdate(
      {
        _id: borrow._id,
        status: 'pending',
        ...(Number(borrow.depositAmount) > 0
          ? {
              $or: [
                { depositStatus: 'held' },
                { depositStatus: { $exists: false }, depositPaid: true },
              ],
            }
          : {}),
      },
      { $set: { status: nextStatus } },
      { new: true }
    );
    if (!updatedBorrow) {
      const activeBorrowExists = await Borrow.exists({
        item: item._id,
        status: { $in: ['active', 'overdue'] },
      });
      if (!activeBorrowExists) {
        await Item.updateOne({ _id: item._id, status: 'lent' }, { $set: { status: 'available' } });
      }
      res.status(409);
      throw new Error('This request changed before it could be accepted. Refresh and try again.');
    }

    for (const request of competingRequests) {
      const nextDepositStatus = transitionDepositStatus(request, 'reject_request');
      if (nextDepositStatus === undefined) continue;

      request.status = 'rejected';
      request.depositStatus = nextDepositStatus;
      await request.save();
      await Notification.create({
        user: request.borrower,
        borrow: request._id,
        message: `Another request for ${item.name} was accepted, so your request was declined.`,
        type: 'rejection',
      });

      if (nextDepositStatus === 'return_pending') {
        await Notification.create({
          user: request.owner,
          borrow: request._id,
          message: `Return the ₹${request.depositAmount} deposit to the declined borrower for ${item.name}.`,
          type: 'return',
        });
        await Notification.create({
          user: request.borrower,
          borrow: request._id,
          message: `The owner must return your ₹${request.depositAmount} deposit.`,
          type: 'return',
        });
      }
    }

    await Notification.create({
      user: borrow.borrower,
      borrow: borrow._id,
      message: `Your request to borrow ${item.name} has been approved`,
      type: 'approval',
    });

    res.json({ success: true, borrow: updatedBorrow });
  } catch (error) {
    next(error);
  }
};

export const rejectRequest = async (req, res, next) => {
  try {
    const borrow = await Borrow.findById(req.params.id).populate('item');

    if (!borrow) {
      res.status(404);
      throw new Error('Borrow request not found');
    }

    if (borrow.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to reject this request');
    }

    if (borrow.status !== 'pending') {
      res.status(400);
      throw new Error('Can only reject pending requests');
    }

    const depositStatus = resolveDepositStatus(borrow);
    const nextDepositStatus = transitionDepositStatus(borrow, 'reject_request');
    if (nextDepositStatus === undefined) {
      res.status(400);
      throw new Error(depositStatus === 'payment_pending'
        ? 'Resolve the reported deposit payment before rejecting this request'
        : 'This request cannot be rejected in its current state');
    }

    borrow.status = 'rejected';
    borrow.depositStatus = nextDepositStatus;
    await borrow.save();

    await Notification.create({
      user: borrow.borrower,
      borrow: borrow._id,
      message: `Your request to borrow ${borrow.item.name} has been rejected`,
      type: 'rejection',
    });

    if (nextDepositStatus === 'return_pending') {
      await Notification.create({
        user: borrow.owner,
        borrow: borrow._id,
        message: `Return the ₹${borrow.depositAmount} deposit to the borrower and mark it sent.`,
        type: 'return',
      });
      await Notification.create({
        user: borrow.borrower,
        borrow: borrow._id,
        message: `Your request was declined. The owner must return your ₹${borrow.depositAmount} deposit.`,
        type: 'return',
      });
    }

    res.json({ success: true, borrow });
  } catch (error) {
    next(error);
  }
};

export const signalReturn = async (req, res, next) => {
  try {
    const borrow = await Borrow.findById(req.params.id).populate('item');

    if (!borrow) {
      res.status(404);
      throw new Error('Borrow record not found');
    }

    if (borrow.borrower.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to return this item');
    }

    if (borrow.status !== 'active' && borrow.status !== 'overdue') {
      res.status(400);
      throw new Error('Item is not currently active or overdue');
    }

    if (borrow.returnSignaledAt) {
      return res.json({ success: true, message: 'Return has already been signalled' });
    }

    borrow.returnSignaledAt = new Date();
    await borrow.save();

    await Notification.create({
      user: borrow.owner,
      borrow: borrow._id,
      message: `${req.user.name} has signalled the return of ${borrow.item.name}. Please confirm upon receipt.`,
      type: 'return',
    });

    res.json({ success: true, message: 'Return signalled successfully' });
  } catch (error) {
    next(error);
  }
};

export const confirmReturn = async (req, res, next) => {
  try {
    const borrow = await Borrow.findById(req.params.id).populate('item');

    if (!borrow) {
      res.status(404);
      throw new Error('Borrow record not found');
    }

    if (borrow.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to confirm this return');
    }

    if (borrow.status !== 'active' && borrow.status !== 'overdue') {
      res.status(400);
      throw new Error('Item is not currently active or overdue');
    }

    if (!borrow.returnSignaledAt) {
      res.status(400);
      throw new Error('The borrower must signal the return before it can be confirmed');
    }

    const depositStatus = resolveDepositStatus(borrow);
    const nextDepositStatus = transitionDepositStatus(borrow, 'complete_return');
    if (nextDepositStatus === undefined && depositStatus === 'payment_pending') {
      res.status(400);
      throw new Error('Confirm or reject the reported deposit payment before completing the return');
    }
    if (nextDepositStatus === undefined) {
      res.status(400);
      throw new Error('The deposit state does not allow this return to be completed');
    }

    borrow.status = 'returned';
    borrow.returnDate = borrow.returnSignaledAt;
    borrow.depositStatus = nextDepositStatus;

    const { fineAmount } = calculateFine(borrow.dueDate, borrow.item.finePerDay, borrow.returnDate);
    if (fineAmount > 0) {
      borrow.fineAmount = fineAmount;
      borrow.paymentStatus = 'overdue';
    } else {
      borrow.paymentStatus = 'paid';
    }

    await borrow.save();

    const item = await Item.findById(borrow.item._id);
    item.status = 'available';
    await item.save();

    await Notification.create({
      user: borrow.borrower,
      borrow: borrow._id,
      message: `The return of ${item.name} has been confirmed by the owner.`,
      type: 'return',
    });

    if (depositStatus === 'held') {
      await Notification.create({
        user: borrow.borrower,
        borrow: borrow._id,
        message: `The ₹${borrow.depositAmount} deposit for ${item.name} is awaiting return from the owner.`,
        type: 'return',
      });
    }

    if (fineAmount > 0) {
      await Notification.create({
        user: borrow.borrower,
        borrow: borrow._id,
        message: `You have been fined ₹${fineAmount} for the overdue return of ${item.name}.`,
        type: 'fine',
      });
    }

    res.json({ success: true, borrow });
  } catch (error) {
    next(error);
  }
};

export const payDeposit = async (req, res, next) => {
  try {
    const borrow = await Borrow.findById(req.params.id);

    if (!borrow) {
      res.status(404);
      throw new Error('Borrow record not found');
    }

    if (borrow.borrower.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    if (!['pending', 'active', 'overdue'].includes(borrow.status) || !(Number(borrow.depositAmount) > 0)) {
      res.status(400);
      throw new Error('A deposit can only be reported for a pending or active borrow that requires one');
    }
    const nextDepositStatus = transitionDepositStatus(borrow, 'report_payment');
    if (!nextDepositStatus) {
      res.status(400);
      throw new Error('This deposit is already paid or awaiting lender confirmation');
    }

    borrow.depositStatus = nextDepositStatus;
    borrow.depositPaymentReportedAt = new Date();
    await borrow.save();

    await Notification.create({
      user: borrow.owner,
      borrow: borrow._id,
      message: `${req.user.name} reports paying the ₹${borrow.depositAmount} deposit. Confirm receipt after checking.`,
      type: 'return',
    });

    res.json({ success: true, message: 'Deposit payment reported; waiting for owner confirmation', borrow });
  } catch (error) {
    next(error);
  }
};

export const confirmDepositReceived = async (req, res, next) => {
  try {
    const borrow = await Borrow.findById(req.params.id);
    if (!borrow) {
      res.status(404);
      throw new Error('Borrow record not found');
    }
    if (borrow.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }
    const nextDepositStatus = transitionDepositStatus(borrow, 'confirm_payment');
    if (!nextDepositStatus) {
      res.status(400);
      throw new Error('There is no deposit payment awaiting confirmation');
    }

    borrow.depositPaid = true;
    borrow.depositStatus = nextDepositStatus;
    borrow.depositReceivedAt = new Date();
    await borrow.save();

    await Notification.create({
      user: borrow.borrower,
      borrow: borrow._id,
      message: `The owner confirmed receipt of your ₹${borrow.depositAmount} deposit.`,
      type: 'return',
    });

    res.json({ success: true, message: 'Deposit receipt confirmed', borrow });
  } catch (error) {
    next(error);
  }
};

export const rejectDepositPayment = async (req, res, next) => {
  try {
    const borrow = await Borrow.findById(req.params.id);
    if (!borrow) {
      res.status(404);
      throw new Error('Borrow record not found');
    }
    if (borrow.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }
    const nextDepositStatus = transitionDepositStatus(borrow, 'reject_payment');
    if (!nextDepositStatus) {
      res.status(400);
      throw new Error('There is no deposit payment awaiting confirmation');
    }

    borrow.depositStatus = nextDepositStatus;
    borrow.depositPaymentReportedAt = undefined;
    await borrow.save();

    await Notification.create({
      user: borrow.borrower,
      borrow: borrow._id,
      message: 'The owner could not confirm receipt of your deposit. Contact the owner and report payment again after it is received.',
      type: 'return',
    });

    res.json({ success: true, message: 'Deposit payment report rejected', borrow });
  } catch (error) {
    next(error);
  }
};

export const confirmDepositReturnSent = async (req, res, next) => {
  try {
    const borrow = await Borrow.findById(req.params.id);
    if (!borrow) {
      res.status(404);
      throw new Error('Borrow record not found');
    }
    if (borrow.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }
    const nextDepositStatus = transitionDepositStatus(borrow, 'send_deposit_return');
    if (!nextDepositStatus) {
      res.status(400);
      throw new Error('There is no deposit awaiting return to the borrower');
    }

    borrow.depositStatus = nextDepositStatus;
    borrow.depositReturnSentAt = new Date();
    await borrow.save();

    await Notification.create({
      user: borrow.borrower,
      borrow: borrow._id,
      message: `The owner marked your ₹${borrow.depositAmount} deposit as returned. Acknowledge receipt to complete the deposit return.`,
      type: 'return',
    });

    res.json({ success: true, message: 'Deposit return marked as sent', borrow });
  } catch (error) {
    next(error);
  }
};

export const acknowledgeDepositReturn = async (req, res, next) => {
  try {
    const borrow = await Borrow.findById(req.params.id);
    if (!borrow) {
      res.status(404);
      throw new Error('Borrow record not found');
    }
    if (borrow.borrower.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }
    const nextDepositStatus = transitionDepositStatus(borrow, 'acknowledge_deposit_return');
    if (!nextDepositStatus) {
      res.status(400);
      throw new Error('There is no deposit return awaiting your acknowledgement');
    }

    borrow.depositStatus = nextDepositStatus;
    borrow.depositReturnAcknowledgedAt = new Date();
    await borrow.save();

    await Notification.create({
      user: borrow.owner,
      borrow: borrow._id,
      message: `The borrower acknowledged receipt of the returned ₹${borrow.depositAmount} deposit.`,
      type: 'return',
    });

    res.json({ success: true, message: 'Deposit return acknowledged', borrow });
  } catch (error) {
    next(error);
  }
};

export const payFine = async (req, res, next) => {
  try {
    const borrow = await Borrow.findById(req.params.id);

    if (!borrow) {
      res.status(404);
      throw new Error('Borrow record not found');
    }

    if (borrow.borrower.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const nextStatus = transitionFinePaymentStatus(borrow, 'report_payment');
    if (!nextStatus) {
      res.status(400);
      throw new Error('There is no unpaid fine available to report');
    }

    borrow.finePaymentStatus = nextStatus;
    borrow.finePaymentReportedAt = new Date();
    await borrow.save();

    await Notification.create({
      user: borrow.owner,
      borrow: borrow._id,
      message: `${req.user.name} reports paying the ₹${borrow.fineAmount} late fine. Confirm receipt after checking.`,
      type: 'fine',
    });

    res.json({ success: true, message: 'Fine payment reported; waiting for owner confirmation', borrow });
  } catch (error) {
    next(error);
  }
};

export const confirmFineReceived = async (req, res, next) => {
  try {
    const borrow = await Borrow.findById(req.params.id);
    if (!borrow) {
      res.status(404);
      throw new Error('Borrow record not found');
    }
    if (borrow.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const nextStatus = transitionFinePaymentStatus(borrow, 'confirm_payment');
    if (!nextStatus) {
      res.status(400);
      throw new Error('There is no fine payment awaiting confirmation');
    }

    borrow.finePaid = true;
    borrow.finePaymentStatus = nextStatus;
    borrow.finePaymentConfirmedAt = new Date();
    borrow.paymentStatus = 'paid';
    await borrow.save();

    await Notification.create({
      user: borrow.borrower,
      borrow: borrow._id,
      message: `The owner confirmed receipt of your ₹${borrow.fineAmount} late fine.`,
      type: 'fine',
    });

    res.json({ success: true, borrow });
  } catch (error) {
    next(error);
  }
};

export const rejectFinePayment = async (req, res, next) => {
  try {
    const borrow = await Borrow.findById(req.params.id);
    if (!borrow) {
      res.status(404);
      throw new Error('Borrow record not found');
    }
    if (borrow.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const nextStatus = transitionFinePaymentStatus(borrow, 'reject_payment');
    if (!nextStatus) {
      res.status(400);
      throw new Error('There is no fine payment awaiting confirmation');
    }

    borrow.finePaymentStatus = nextStatus;
    borrow.finePaymentReportedAt = undefined;
    await borrow.save();

    await Notification.create({
      user: borrow.borrower,
      borrow: borrow._id,
      message: 'The owner could not confirm receipt of your fine payment. Contact the owner and report payment again after it is received.',
      type: 'fine',
    });

    res.json({ success: true, borrow });
  } catch (error) {
    next(error);
  }
};

export const rateBorrower = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    const borrow = await Borrow.findById(req.params.id);

    if (!borrow) {
      res.status(404);
      throw new Error('Borrow record not found');
    }

    if (borrow.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to rate');
    }

    if (borrow.status !== 'returned') {
      res.status(400);
      throw new Error('Can only rate after item is returned');
    }

    if (borrow.borrowerRating) {
      res.status(400);
      throw new Error('You have already rated the borrower for this transaction');
    }

    borrow.borrowerRating = rating;
    borrow.borrowerReview = review;
    await borrow.save();

    const borrower = await User.findById(borrow.borrower);
    borrower.totalRatings += 1;
    borrower.averageRating =
      (borrower.averageRating * (borrower.totalRatings - 1) + rating) /
      borrower.totalRatings;
    await borrower.save();

    res.json({ success: true, borrow });
  } catch (error) {
    next(error);
  }
};

export const rateOwnerAndItem = async (req, res, next) => {
  try {
    const { ownerRating, ownerReview, itemRating, itemReview } = req.body;
    const borrow = await Borrow.findById(req.params.id);

    if (!borrow) {
      res.status(404);
      throw new Error('Borrow record not found');
    }

    if (borrow.borrower.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to rate');
    }

    if (borrow.status !== 'returned') {
      res.status(400);
      throw new Error('Can only rate after item is returned');
    }

    if (borrow.ownerRating || borrow.itemRating) {
      res.status(400);
      throw new Error('You have already rated for this transaction');
    }

    if (ownerRating) {
      borrow.ownerRating = ownerRating;
      borrow.ownerReview = ownerReview;
      const owner = await User.findById(borrow.owner);
      owner.totalRatings += 1;
      owner.averageRating =
        (owner.averageRating * (owner.totalRatings - 1) + ownerRating) /
        owner.totalRatings;
      await owner.save();
    }

    if (itemRating) {
      borrow.itemRating = itemRating;
      borrow.itemReview = itemReview;
      const item = await Item.findById(borrow.item);
      item.totalRatings += 1;
      item.averageRating =
        (item.averageRating * (item.totalRatings - 1) + itemRating) /
        item.totalRatings;
      await item.save();
    }

    await borrow.save();
    res.json({ success: true, borrow });
  } catch (error) {
    next(error);
  }
};

export const getFinancialSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const normalizeDepositStatus = {
      $addFields: {
        effectiveDepositStatus: {
          $ifNull: [
            '$depositStatus',
            {
              $cond: [
                { $gt: [{ $ifNull: ['$depositAmount', 0] }, 0] },
                {
                  $cond: [
                    '$depositPaid',
                    { $cond: [{ $in: ['$status', ['returned', 'rejected']] }, 'return_pending', 'held'] },
                    'pending',
                  ],
                },
                'not_required',
              ],
            },
          ],
        },
      },
    };

    const asBorrower = await Borrow.aggregate([
      { $match: { borrower: userId } },
      normalizeDepositStatus,
      {
        $group: {
          _id: null,
          totalDepositsPaid: { $sum: { $cond: ['$depositPaid', '$depositAmount', 0] } },
          totalDepositsPending: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$status', ['pending', 'active', 'overdue']] },
                    { $eq: ['$effectiveDepositStatus', 'pending'] },
                  ],
                },
                '$depositAmount',
                0,
              ],
            },
          },
          totalDepositsAwaitingConfirmation: {
            $sum: {
              $cond: [
                { $eq: ['$effectiveDepositStatus', 'payment_pending'] },
                '$depositAmount',
                0,
              ],
            },
          },
          totalDepositsHeld: {
            $sum: {
              $cond: [{ $eq: ['$effectiveDepositStatus', 'held'] }, '$depositAmount', 0],
            },
          },
          totalDepositsReturnPending: {
            $sum: {
              $cond: [
                { $in: ['$effectiveDepositStatus', ['return_pending', 'return_sent']] },
                '$depositAmount',
                0,
              ],
            },
          },
          totalDepositsReturned: {
            $sum: {
              $cond: [{ $eq: ['$effectiveDepositStatus', 'returned'] }, '$depositAmount', 0],
            },
          },
          totalFinesPaid: { $sum: { $cond: ['$finePaid', '$fineAmount', 0] } },
          totalFinesPending: { $sum: { $cond: [{ $not: '$finePaid' }, '$fineAmount', 0] } },
          totalFinesAwaitingConfirmation: {
            $sum: {
              $cond: [{ $eq: ['$finePaymentStatus', 'payment_pending'] }, '$fineAmount', 0],
            },
          },
        },
      },
    ]);

    const asOwner = await Borrow.aggregate([
      { $match: { owner: userId } },
      normalizeDepositStatus,
      {
        $group: {
          _id: null,
          totalDepositsCollected: { $sum: { $cond: ['$depositPaid', '$depositAmount', 0] } },
          totalDepositsAwaitingConfirmation: {
            $sum: {
              $cond: [{ $eq: ['$effectiveDepositStatus', 'payment_pending'] }, '$depositAmount', 0],
            },
          },
          totalDepositsHeld: {
            $sum: {
              $cond: [{ $eq: ['$effectiveDepositStatus', 'held'] }, '$depositAmount', 0],
            },
          },
          totalDepositsReturnPending: {
            $sum: {
              $cond: [
                { $in: ['$effectiveDepositStatus', ['return_pending', 'return_sent']] },
                '$depositAmount',
                0,
              ],
            },
          },
          totalDepositsReturned: {
            $sum: {
              $cond: [{ $eq: ['$effectiveDepositStatus', 'returned'] }, '$depositAmount', 0],
            },
          },
          totalFinesCollected: { $sum: { $cond: ['$finePaid', '$fineAmount', 0] } },
          totalFinesAwaitingConfirmation: {
            $sum: {
              $cond: [{ $eq: ['$finePaymentStatus', 'payment_pending'] }, '$fineAmount', 0],
            },
          },
        },
      },
    ]);

    res.json({
      success: true,
      summary: {
        borrower: asBorrower[0] || {
          totalDepositsPaid: 0,
          totalDepositsPending: 0,
          totalDepositsAwaitingConfirmation: 0,
          totalDepositsHeld: 0,
          totalDepositsReturnPending: 0,
          totalDepositsReturned: 0,
          totalFinesPaid: 0,
          totalFinesPending: 0,
          totalFinesAwaitingConfirmation: 0,
        },
        owner: asOwner[0] || {
          totalDepositsCollected: 0,
          totalDepositsAwaitingConfirmation: 0,
          totalDepositsHeld: 0,
          totalDepositsReturnPending: 0,
          totalDepositsReturned: 0,
          totalFinesCollected: 0,
          totalFinesAwaitingConfirmation: 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
