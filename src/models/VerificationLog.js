
import mongoose from 'mongoose';

const verificationLogSchema = new mongoose.Schema({
  tradesperson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['approved', 'rejected'],
    required: true
  },
  note: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Add compound index for tradesperson and timestamp
verificationLogSchema.index({ tradesperson: 1, timestamp: -1 });

const VerificationLog = mongoose.models.VerificationLog || mongoose.model('VerificationLog', verificationLogSchema);

export { VerificationLog };