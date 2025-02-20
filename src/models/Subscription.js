
// models/Subscription.js
const subscriptionSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'Subscription name is required'],
      unique: true,
    },
    description: String,
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
      billingCycle: {
        type: String,
        enum: ['monthly', 'quarterly', 'annually'],
        default: 'monthly',
      },
    },
    benefits: [{
      type: String,
    }],
    creditsIncluded: {
      type: Number,
      default: 0,
    },
    features: {
      prioritySupport: Boolean,
      featuredProfile: Boolean,
      earlyAccessToJobs: Boolean,
      discountedExtraCredits: Number, // Percentage discount
      maxActiveApplications: Number,
      customBranding: Boolean,
      applicationBadge: Boolean,
      maxPortfolioItems: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: Number,
    stripePriceId: String,
  }, {
    timestamps: true,
  });
  