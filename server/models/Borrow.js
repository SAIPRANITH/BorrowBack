import mongoose from 'mongoose';

const borrowSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    borrower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    status: {
      type: String,
      enum: ['pending', 'active', 'returned', 'overdue', 'rejected'],
      default: 'pending',
    },
    depositAmount: {
      type: Number,
      default: 0,
    },
    depositPaid: {
      type: Boolean,
      default: false,
    },
    fineAmount: {
      type: Number,
      default: 0,
    },
    finePaid: {
      type: Boolean,
      default: false,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending',
    },
    borrowerRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    borrowerReview: {
      type: String,
    },
    ownerRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    ownerReview: {
      type: String,
    },
    itemRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    itemReview: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Borrow = mongoose.model('Borrow', borrowSchema);
export default Borrow;
