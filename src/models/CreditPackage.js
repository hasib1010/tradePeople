// models/CreditPackage.js
import mongoose from 'mongoose';

const creditPackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Package name is required'],
    unique: true,
  },
  description: String,
  credits: {
    type: Number,
    required: [true, 'Number of credits is required'],
    min: [1, 'Package must include at least 1 credit'],
  },
  price: {
    amount: {
      type: Number,
      required: [true, 'Price amount is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  bonusCredits: {
    type: Number,
    default: 0,
  },
  expiryDays: {
    type: Number,
    default: 365, // Credits expire after a year by default
  },
  displayOrder: Number,
  stripePriceId: String,
}, {
  timestamps: true,
});
