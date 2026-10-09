import Borrow from '../models/Borrow.js';
import Item from '../models/Item.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { calculateFine } from '../utils/fineCalculator.js';

export const createBorrowRequest = async (req, res, next) => {
  try {
    const { item: itemId, dueDate } = req.body;

    const item = await Item.findById(itemId);

    if (!item) {
      res.status(404);
      throw new Error('Item not found');
    }

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
      status: { $in: ['pending', 'active'] },
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

    borrow.status = 'active';
    await borrow.save();

    const item = await Item.findById(borrow.item._id);
    item.status = 'lent';
    await item.save();

    // Reject other pending requests for the same item
    await Borrow.updateMany(
      { item: item._id, status: 'pending', _id: { $ne: borrow._id } },
      { $set: { status: 'rejected' } }
    );

    await Notification.create({
      user: borrow.borrower,
      borrow: borrow._id,
      message: `Your request to borrow ${item.name} has been approved`,
      type: 'approval',
    });

    res.json({ success: true, borrow });
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

    borrow.status = 'rejected';
    await borrow.save();

    await Notification.create({
      user: borrow.borrower,
      borrow: borrow._id,
      message: `Your request to borrow ${borrow.item.name} has been rejected`,
      type: 'rejection',
    });

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

    if (borrow.status !== 'active') {
      res.status(400);
      throw new Error('Item is not currently active');
    }

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

    borrow.status = 'returned';
    borrow.returnDate = Date.now();

    const { fineAmount } = calculateFine(borrow.dueDate, borrow.item.finePerDay);
    if (fineAmount > 0) {
      borrow.fineAmount = fineAmount;
      borrow.paymentStatus = 'overdue';
    } else {
      borrow.paymentStatus = borrow.depositPaid ? 'paid' : 'pending';
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

    if (fineAmount > 0) {
      await Notification.create({
        user: borrow.borrower,
        borrow: borrow._id,
        message: `You have been fined $${fineAmount} for the overdue return of ${item.name}.`,
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

    borrow.depositPaid = true;
    if (borrow.fineAmount === 0 || borrow.finePaid) {
      borrow.paymentStatus = 'paid';
    }

    await borrow.save();
    res.json({ success: true, borrow });
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

    borrow.finePaid = true;
    if (borrow.depositPaid) {
      borrow.paymentStatus = 'paid';
    }

    await borrow.save();
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

    const asBorrower = await Borrow.aggregate([
      { $match: { borrower: userId } },
      {
        $group: {
          _id: null,
          totalDepositsPaid: { $sum: { $cond: ['$depositPaid', '$depositAmount', 0] } },
          totalDepositsPending: { $sum: { $cond: [{ $not: '$depositPaid' }, '$depositAmount', 0] } },
          totalFinesPaid: { $sum: { $cond: ['$finePaid', '$fineAmount', 0] } },
          totalFinesPending: { $sum: { $cond: [{ $not: '$finePaid' }, '$fineAmount', 0] } },
        },
      },
    ]);

    const asOwner = await Borrow.aggregate([
      { $match: { owner: userId } },
      {
        $group: {
          _id: null,
          totalDepositsCollected: { $sum: { $cond: ['$depositPaid', '$depositAmount', 0] } },
          totalFinesCollected: { $sum: { $cond: ['$finePaid', '$fineAmount', 0] } },
        },
      },
    ]);

    res.json({
      success: true,
      summary: {
        borrower: asBorrower[0] || {
          totalDepositsPaid: 0,
          totalDepositsPending: 0,
          totalFinesPaid: 0,
          totalFinesPending: 0,
        },
        owner: asOwner[0] || {
          totalDepositsCollected: 0,
          totalFinesCollected: 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
