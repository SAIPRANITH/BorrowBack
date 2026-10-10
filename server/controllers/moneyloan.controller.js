import mongoose from 'mongoose';
import MoneyLoan from '../models/MoneyLoan.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { transitionMoneyLoanStatus } from '../utils/moneyLoanWorkflow.js';

const updateOverdueLoans = async (userId) => {
  await MoneyLoan.updateMany(
    {
      $or: [{ borrower: userId }, { lender: userId }],
      status: 'active',
      dueDate: { $lt: new Date() },
    },
    { $set: { status: 'overdue' } }
  );
};

export const createLoanRequest = async (req, res, next) => {
  try {
    const { lenderId, amount, interestRate, dueDate, purpose, note } = req.body;
    const parsedAmount = Number(amount);
    const parsedInterestRate = interestRate == null ? 0 : Number(interestRate);
    const parsedDueDate = new Date(dueDate);

    if (!mongoose.isValidObjectId(lenderId)) {
      return res.status(400).json({ success: false, message: 'Select a valid lender' });
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount < 100) {
      return res.status(400).json({ success: false, message: 'Loan amount must be at least 100' });
    }
    if (!Number.isFinite(parsedInterestRate) || parsedInterestRate < 0) {
      return res.status(400).json({ success: false, message: 'Interest rate must be zero or greater' });
    }
    if (!Number.isFinite(parsedDueDate.getTime()) || parsedDueDate <= new Date()) {
      return res.status(400).json({ success: false, message: 'Repayment due date must be in the future' });
    }
    if (typeof purpose !== 'string' || !purpose.trim()) {
      return res.status(400).json({ success: false, message: 'Loan purpose is required' });
    }
    if (req.user._id.toString() === lenderId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot borrow from yourself' });
    }
    if (!(await User.exists({ _id: lenderId }))) {
      return res.status(404).json({ success: false, message: 'Lender not found' });
    }

    const totalRepayable = Math.round((parsedAmount + (parsedAmount * parsedInterestRate / 100)) * 100) / 100;

    const loan = await MoneyLoan.create({
      borrower: req.user._id,
      lender: lenderId,
      amount: parsedAmount,
      interestRate: parsedInterestRate,
      totalRepayable,
      dueDate: parsedDueDate,
      purpose: purpose.trim(),
      note: typeof note === 'string' ? note.trim() : '',
      status: 'pending'
    });

    await Notification.create({
      user: lenderId,
      type: 'request',
      message: `User ${req.user.name} has requested a loan of ${amount}.`
    });

    res.status(201).json({ success: true, loan });
  } catch (error) {
    next(error);
  }
};

export const getAvailableLenders = async (req, res, next) => {
  try {
    const lenders = await User.find({ _id: { $ne: req.user._id } })
      .select('-password')
      .lean();
    
    res.status(200).json({ success: true, lenders });
  } catch (error) {
    next(error);
  }
};

export const getMyLoanRequests = async (req, res, next) => {
  try {
    await updateOverdueLoans(req.user._id);
    const loans = await MoneyLoan.find({ borrower: req.user._id })
      .populate('lender', 'name email averageRating');

    res.status(200).json({ success: true, count: loans.length, loans });
  } catch (error) {
    next(error);
  }
};

export const getIncomingLoanRequests = async (req, res, next) => {
  try {
    const requests = await MoneyLoan.find({ lender: req.user._id, status: 'pending' })
      .populate('borrower', 'name email phone averageRating');

    res.status(200).json({ success: true, count: requests.length, requests });
  } catch (error) {
    next(error);
  }
};

export const getLendingHistory = async (req, res, next) => {
  try {
    await updateOverdueLoans(req.user._id);
    const loans = await MoneyLoan.find({ lender: req.user._id })
      .populate('borrower', 'name email phone averageRating');

    res.status(200).json({ success: true, count: loans.length, loans });
  } catch (error) {
    next(error);
  }
};

export const acceptLoan = async (req, res, next) => {
  try {
    const loan = await MoneyLoan.findById(req.params.id);
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.lender.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (loan.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending loans can be accepted' });

    loan.status = 'active';
    await loan.save();

    await Notification.create({
      user: loan.borrower,
      type: 'approval',
      message: `Your loan request for ${loan.amount} has been accepted.`
    });

    res.status(200).json({ success: true, loan });
  } catch (error) {
    next(error);
  }
};

export const rejectLoan = async (req, res, next) => {
  try {
    const loan = await MoneyLoan.findById(req.params.id);
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.lender.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (loan.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending loans can be rejected' });

    loan.status = 'rejected';
    await loan.save();

    await Notification.create({
      user: loan.borrower,
      type: 'rejection',
      message: `Your loan request for ${loan.amount} has been rejected.`
    });

    res.status(200).json({ success: true, loan });
  } catch (error) {
    next(error);
  }
};

export const repayLoan = async (req, res, next) => {
  try {
    const loan = await MoneyLoan.findById(req.params.id);
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.borrower.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    const nextStatus = transitionMoneyLoanStatus(loan, 'report_repayment');
    if (!nextStatus) return res.status(400).json({ success: false, message: 'Only active or overdue loans can be marked as repaid' });

    loan.status = nextStatus;
    loan.repaymentReportedAt = new Date();
    await loan.save();

    await Notification.create({
      user: loan.lender,
      type: 'return',
      message: `Your loan of ${loan.amount} has been marked as repaid by the borrower.`
    });

    res.status(200).json({ success: true, loan });
  } catch (error) {
    next(error);
  }
};

export const confirmRepayment = async (req, res, next) => {
  try {
    const loan = await MoneyLoan.findById(req.params.id);
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.lender.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    const nextStatus = transitionMoneyLoanStatus(loan, 'confirm_repayment');
    if (!nextStatus) return res.status(400).json({ success: false, message: 'There is no repayment awaiting confirmation' });

    loan.status = nextStatus;
    loan.returnDate = new Date();
    loan.repaymentConfirmedAt = loan.returnDate;
    await loan.save();

    await Notification.create({
      user: loan.borrower,
      type: 'return',
      message: `Your repayment for loan of ${loan.amount} has been confirmed.`
    });

    res.status(200).json({ success: true, loan });
  } catch (error) {
    next(error);
  }
};

export const rateLender = async (req, res, next) => {
  try {
    const { rating } = req.body;
    const loan = await MoneyLoan.findById(req.params.id);
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.borrower.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (loan.status !== 'repaid') return res.status(400).json({ success: false, message: 'Loan must be repaid first' });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating must be a whole number from 1 to 5' });
    if (loan.lenderRating) return res.status(400).json({ success: false, message: 'You have already rated this lender for this loan' });

    loan.lenderRating = rating;
    await loan.save();
    const lender = await User.findById(loan.lender);
    if (lender) {
      lender.totalRatings += 1;
      lender.averageRating = (lender.averageRating * (lender.totalRatings - 1) + rating) / lender.totalRatings;
      await lender.save();
    }

    res.status(200).json({ success: true, loan });
  } catch (error) {
    next(error);
  }
};

export const rateBorrower = async (req, res, next) => {
  try {
    const { rating } = req.body;
    const loan = await MoneyLoan.findById(req.params.id);
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    if (loan.lender.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (loan.status !== 'repaid') return res.status(400).json({ success: false, message: 'Loan must be repaid first' });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating must be a whole number from 1 to 5' });
    if (loan.borrowerRating) return res.status(400).json({ success: false, message: 'You have already rated this borrower for this loan' });

    loan.borrowerRating = rating;
    await loan.save();
    const borrower = await User.findById(loan.borrower);
    if (borrower) {
      borrower.totalRatings += 1;
      borrower.averageRating = (borrower.averageRating * (borrower.totalRatings - 1) + rating) / borrower.totalRatings;
      await borrower.save();
    }

    res.status(200).json({ success: true, loan });
  } catch (error) {
    next(error);
  }
};

export const getLoanFinancialSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await updateOverdueLoans(userId);
    const asBorrower = await MoneyLoan.find({ borrower: userId });
    const asLender = await MoneyLoan.find({ lender: userId });

    const borrowerSummary = {
      totalBorrowed: asBorrower.reduce((acc, curr) => acc + (curr.status !== 'rejected' ? curr.amount : 0), 0),
      totalRepaid: asBorrower.reduce((acc, curr) => acc + (curr.status === 'repaid' ? (curr.totalRepayable || curr.amount) : 0), 0),
      totalPending: asBorrower.reduce((acc, curr) => acc + (['pending', 'active', 'overdue'].includes(curr.status) ? (curr.totalRepayable || curr.amount) : 0), 0),
      awaitingConfirmation: asBorrower.reduce((acc, curr) => acc + (curr.status === 'repaid_pending' ? (curr.totalRepayable || curr.amount) : 0), 0)
    };

    const lenderSummary = {
      totalLent: asLender.reduce((acc, curr) => acc + (curr.status !== 'rejected' ? curr.amount : 0), 0),
      totalRecovered: asLender.reduce((acc, curr) => acc + (curr.status === 'repaid' ? (curr.totalRepayable || curr.amount) : 0), 0),
      totalOutstanding: asLender.reduce((acc, curr) => acc + (['pending', 'active', 'repaid_pending', 'overdue'].includes(curr.status) ? (curr.totalRepayable || curr.amount) : 0), 0)
    };

    res.status(200).json({
      success: true,
      summary: {
        borrower: borrowerSummary,
        lender: lenderSummary
      }
    });
  } catch (error) {
    next(error);
  }
};
