import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['electronics', 'books', 'sports', 'kitchen', 'stationery', 'clothing', 'tools', 'others'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['available', 'lent', 'unavailable'],
      default: 'available',
    },
    depositAmount: {
      type: Number,
      default: 0,
    },
    finePerDay: {
      type: Number,
      default: 10,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Item = mongoose.model('Item', itemSchema);
export default Item;
