
// models/Transaction.js
const transactionSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
    },
    currency: {
      type: String,
      default: 'USD',
    },
    type: {
      type: String,
      enum: [
        'credit-purchase', 
        'subscription-payment', 
        'refund', 
        'service-fee',
        'withdrawal',
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'disputed'],
      default: 'pending',
    },
    creditsPurchased: Number,
    relatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedModel',
    },
    relatedModel: {
      type: String,
      enum: ['Subscription', 'CreditPackage', 'Job'],
    },
    paymentMethod: {
      type: {
        type: String,
        enum: ['credit-card', 'paypal', 'bank-transfer', 'stripe'],
      },
      last4: String,
      expiryDate: String,
      cardType: String,
    },
    stripePaymentIntentId: String,
    stripeCustomerId: String,
    receiptUrl: String,
    notes: String,
    completedAt: Date,
  }, {
    timestamps: true,
  });
  
  // Add indexes for efficient querying
  transactionSchema.index({ user: 1, createdAt: -1 });
  transactionSchema.index({ status: 1, type: 1 });
  
  const CreditPackage = mongoose.models.CreditPackage || mongoose.model('CreditPackage', creditPackageSchema);
  const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
  const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
  
  export { CreditPackage, Subscription, Transaction };