import MoneyLoan from '../models/MoneyLoan.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

export const createLoanRequest = async (req, res, next) => {
  try {
    const { lenderId, amount, interestRate, dueDate, purpose, note } = req.body;
    
    if (req.user._id.toString() === lenderId) {
      return res.status(400).json({ success: false, message: 'Cannot borrow from yourself' });
    }

    const totalRepayable = amount + (amount * (interestRate || 0) / 100);

    const loan = await MoneyLoan.create({
      borrower: req.user._id,
      lender: lenderId,
      amount,
      interestRate: interestRate || 0,
      totalRepayable,
      dueDate,
      purpose,
      note,
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
      .populate('borrower', 'name email averageRating');

    res.status(200).json({ success: true, count: requests.length, requests });
  } catch (error) {
    next(error);
  }
};

export const getLendingHistory = async (req, res, next) => {
  try {
    const loans = await MoneyLoan.find({ lender: req.user._id })
      .populate('borrower', 'name email averageRating');

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

    loan.status = 'repaid';
    loan.returnDate = Date.now();
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

    loan.status = 'repaid';
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

    loan.lenderRating = rating;
    await loan.save();

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

    loan.borrowerRating = rating;
    await loan.save();

    res.status(200).json({ success: true, loan });
  } catch (error) {
    next(error);
  }
};

export const getLoanFinancialSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const asBorrower = await MoneyLoan.find({ borrower: userId });
    const asLender = await MoneyLoan.find({ lender: userId });

    const borrowerSummary = {
      totalBorrowed: asBorrower.reduce((acc, curr) => acc + (curr.status !== 'rejected' ? curr.amount : 0), 0),
      totalRepaid: asBorrower.reduce((acc, curr) => acc + (curr.status === 'repaid' ? curr.totalRepayable : 0), 0),
      totalPending: asBorrower.reduce((acc, curr) => acc + (['pending', 'active', 'overdue'].includes(curr.status) ? curr.totalRepayable : 0), 0)
    };

    const lenderSummary = {
      totalLent: asLender.reduce((acc, curr) => acc + (curr.status !== 'rejected' ? curr.amount : 0), 0),
      totalRecovered: asLender.reduce((acc, curr) => acc + (curr.status === 'repaid' ? curr.totalRepayable : 0), 0),
      totalOutstanding: asLender.reduce((acc, curr) => acc + (['pending', 'active', 'overdue'].includes(curr.status) ? curr.totalRepayable : 0), 0)
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
