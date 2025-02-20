import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  tradesperson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  coverLetter: {
    type: String,
    required: [true, 'Cover letter is required'],
  },
  proposedBudget: {
    amount: Number,
    type: {
      type: String,
      enum: ['fixed', 'hourly'],
    },
    currency: {
      type: String,
      default: 'USD',
    },
  },
  proposedTimeline: {
    startDate: Date,
    endDate: Date,
    estimatedDuration: {
      value: Number,
      unit: {
        type: String,
        enum: ['hours', 'days', 'weeks', 'months'],
      },
    },
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  status: {
    type: String,
    enum: ['pending', 'viewed', 'shortlisted', 'selected', 'rejected', 'withdrawn'],
    default: 'pending',
  },
  creditCost: {
    type: Number,
    default: 1,
  },
  notes: {
    customer: String,
    tradesperson: String,
  },
}, {
  timestamps: true,
});

// Add unique constraint to prevent duplicate applications
applicationSchema.index({ job: 1, tradesperson: 1 }, { unique: true });

// Add indexes for efficient querying
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ tradesperson: 1, status: 1 });

const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

export default Application;