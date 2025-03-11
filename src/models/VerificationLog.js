// src/models/VerificationLog.js
import mongoose from 'mongoose';

const verificationLogSchema = new mongoose.Schema({
  tradesperson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
    default: Date.now
  }
}, { timestamps: true });

// Add index for faster retrieval
verificationLogSchema.index({ tradesperson: 1 });
verificationLogSchema.index({ admin: 1 });
verificationLogSchema.index({ timestamp: -1 });

export const VerificationLog = mongoose.models.VerificationLog || 
  mongoose.model('VerificationLog', verificationLogSchema);