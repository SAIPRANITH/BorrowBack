import mongoose from 'mongoose';

const moneyLoanSchema = new mongoose.Schema(
  {
    lender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    borrower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 100,
    },
    interestRate: {
      type: Number,
      default: 0,
    },
    totalRepayable: {
      type: Number,
    },
    borrowDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
    },
    fundsSentAt: {
      type: Date,
    },
    fundsReceivedAt: {
      type: Date,
    },
    repaymentReportedAt: {
      type: Date,
    },
    repaymentConfirmedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'disbursement_pending',
        'disbursement_sent',
        'active',
        'repaid_pending',
        'repaid',
        'overdue',
        'rejected',
      ],
      default: 'pending',
    },
    purpose: {
      type: String,
      required: true,
    },
    note: {
      type: String,
    },
    lenderRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    borrowerRating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('MoneyLoan', moneyLoanSchema);
