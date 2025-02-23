// src/models/Transaction.js
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
    },
    type: {
        type: String,
        enum: ['purchase', 'usage', 'refund', 'bonus', 'expiration'],
        required: true,
        index: true
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'canceled'],
        default: 'pending',
        index: true
    },
    paymentMethodId: {
        type: String,
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },
    relatedType: {
        type: String,
        enum: ['Application', 'Job', 'Subscription'],
    },
    metadata: {
        type: Map,
        of: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
});

// Add compound index for userId and type
transactionSchema.index({ userId: 1, type: 1 });

// Add compound index for createdAt and userId for faster history retrieval
transactionSchema.index({ userId: 1, createdAt: -1 });

// Pre-save middleware to update updatedAt
transactionSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

export default Transaction;