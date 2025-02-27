// src/models/Review.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  tradesperson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  categories: {
    workQuality: {
      type: Number,
      min: 0,
      max: 5
    },
    communication: {
      type: Number,
      min: 0,
      max: 5
    },
    punctuality: {
      type: Number,
      min: 0,
      max: 5
    },
    valueForMoney: {
      type: Number,
      min: 0,
      max: 5
    }
  },
  recommendationLikelihood: {
    type: Number,
    min: 0,
    max: 5
  },
  status: {
    type: String,
    enum: ['pending', 'published', 'rejected', 'flagged'],
    default: 'published'
  },
  adminReviewed: {
    type: Boolean,
    default: false
  },
  tradespersonResponse: {
    content: String,
    submittedAt: Date
  },
  flags: [{
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'other']
    },
    description: String,
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    flaggedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexing for efficient querying
reviewSchema.index({ tradesperson: 1, status: 1 });
reviewSchema.index({ job: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ rating: 1 });

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review;