// models/Review.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job reference is required'],
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewer is required'],
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewee is required'],
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    minlength: [10, 'Comment must be at least 10 characters'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
  },
  images: [String],
  attributes: {
    punctuality: {
      type: Number,
      min: 1,
      max: 5,
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5,
    },
    workQuality: {
      type: Number,
      min: 1,
      max: 5,
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
    },
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  isVerified: {
    type: Boolean,
    default: true,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ['pending', 'published', 'flagged', 'removed'],
    default: 'published',
  },
  response: {
    comment: String,
    date: Date,
  },
  flags: [{
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'false_information', 'other'],
    },
    description: String,
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    flaggedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'accepted', 'rejected'],
      default: 'pending',
    },
  }],
  helpfulVotes: {
    count: {
      type: Number,
      default: 0,
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  unhelpfulVotes: {
    count: {
      type: Number,
      default: 0,
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
reviewSchema.index({ reviewee: 1, createdAt: -1 });
reviewSchema.index({ job: 1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ status: 1 });

// Middleware to prevent duplicate reviews
reviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existingReview = await this.constructor.findOne({
      job: this.job,
      reviewer: this.reviewer,
      reviewee: this.reviewee,
    });
    
    if (existingReview) {
      const error = new Error('A review for this job already exists');
      error.statusCode = 400;
      return next(error);
    }
  }
  next();
});

// Calculate average attribute ratings
reviewSchema.pre('save', function(next) {
  const attrs = this.attributes;
  let sum = 0;
  let count = 0;
  
  for (const key in attrs) {
    if (attrs[key]) {
      sum += attrs[key];
      count++;
    }
  }
  
  // If attributes are provided, use their average as the main rating
  // if not specified explicitly
  if (count > 0 && !this.rating) {
    this.rating = Math.round((sum / count) * 10) / 10;
  }
  
  next();
});

// Static method to get average rating for a user
reviewSchema.statics.getAverageRatingForUser = async function(userId) {
  const result = await this.aggregate([
    { $match: { reviewee: mongoose.Types.ObjectId(userId), status: 'published' } },
    { $group: {
        _id: '$reviewee',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratings: {
          $push: {
            rating: '$rating',
            jobId: '$job',
            comment: '$comment',
            createdAt: '$createdAt'
          }
        }
      }
    }
  ]);
  
  return result[0] || { averageRating: 0, totalReviews: 0, ratings: [] };
};

// Method to vote on review helpfulness
reviewSchema.methods.vote = async function(userId, isHelpful) {
  // Remove user from both arrays first to prevent duplicate votes
  this.helpfulVotes.users = this.helpfulVotes.users.filter(
    id => id.toString() !== userId.toString()
  );
  this.unhelpfulVotes.users = this.unhelpfulVotes.users.filter(
    id => id.toString() !== userId.toString()
  );
  
  // Add user to appropriate array
  if (isHelpful) {
    this.helpfulVotes.users.push(userId);
  } else {
    this.unhelpfulVotes.users.push(userId);
  }
  
  // Update counts
  this.helpfulVotes.count = this.helpfulVotes.users.length;
  this.unhelpfulVotes.count = this.unhelpfulVotes.users.length;
  
  return this.save();
};

// Method to add a response to a review
reviewSchema.methods.addResponse = async function(responseText) {
  this.response = {
    comment: responseText,
    date: new Date()
  };
  
  return this.save();
};

// Method to flag a review
reviewSchema.methods.flagReview = async function(flagData) {
  this.flags.push(flagData);
  
  // If there are multiple flags, consider changing status
  if (this.flags.length >= 3) {
    this.status = 'flagged';
  }
  
  return this.save();
};

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review;