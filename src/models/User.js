// src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
    },
    role: {
        type: String,
        enum: ['customer', 'tradesperson', 'admin'],
        required: true,
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
    },
    profileImage: {
        type: String,
        default: '/assets/images/default-profile.png',
    },
    location: {
        address: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
        // Make the entire coordinates field optional
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                required: function () {
                    // Only require type if coordinates exist
                    return Array.isArray(this.location?.coordinates?.coordinates) &&
                        this.location.coordinates.coordinates.length === 2;
                }
            },
            coordinates: {
                type: [Number],
                validate: {
                    validator: function (v) {
                        // Either have no coordinates or have exactly 2 valid numbers
                        return !v || (v.length === 2 && !isNaN(v[0]) && !isNaN(v[1]));
                    },
                    message: 'Coordinates must be an array of two numbers'
                }
            }
        }
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    lastLogin: Date,
}, {
    discriminatorKey: 'role',
    timestamps: true,
});

// Add index for location-based queries
userSchema.index({ 'location.coordinates': '2dsphere' });

// Password hashing middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Customer schema (extends User)
const customerSchema = new mongoose.Schema({
    jobsPosted: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
    }],
    favoriteTradespeople: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
});

// Tradesperson schema (extends User)
const tradespersonSchema = new mongoose.Schema({
    businessName: {
        type: String,
        trim: true,
    },
    skills: [{
        type: String,
        enum: [
            'Plumbing', 'Electrical', 'Carpentry', 'Painting',
            'Roofing', 'HVAC', 'Landscaping', 'Masonry',
            'Flooring', 'Tiling', 'General Contracting', 'Drywall',
            'Cabinetry', 'Fencing', 'Decking', 'Concrete',
            'Window Installation', 'Door Installation', 'Appliance Repair',
            'Handyman Services', 'Cleaning Services', 'Moving Services',
            'Other'
        ],
    }],
    yearsOfExperience: Number,
    hourlyRate: Number,
    description: String,
    certifications: [{
        name: String,
        issuingOrganization: String,
        dateIssued: Date,
        expirationDate: Date,
        documentUrl: String,
        isVerified: {
            type: Boolean,
            default: false,
        },
    }],
    portfolio: [{
        title: String,
        description: String,
        imageUrls: [String],
        projectDate: Date,
    }],
    availability: {
        workDays: [{
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        }],
        workHours: {
            start: String,
            end: String,
        },
        isAvailableNow: Boolean,
    },
    serviceArea: {
        radius: Number, // in miles/km
        cities: [String],
    },
    credits: {
        available: {
            type: Number,
            default: 0,
        },
        spent: {
            type: Number,
            default: 0,
        },
        history: [{
            amount: Number,
            transactionType: {
                type: String,
                enum: ['purchase', 'usage', 'refund', 'bonus', 'expiration'],
            },
            relatedTo: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: 'credits.history.relatedModel',
            },
            relatedModel: {
                type: String,
                enum: ['Job', 'Transaction', 'Subscription'],
            },
            date: {
                type: Date,
                default: Date.now,
            },
            notes: String,
        }],
    },
    subscription: {
        plan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subscription',
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'canceled', 'expired', 'pending'],
        },
        startDate: Date,
        endDate: Date,
        autoRenew: {
            type: Boolean,
            default: true,
        },
        stripeSubscriptionId: String,
    },
    averageRating: {
        type: Number,
        default: 0,
    },
    totalReviews: {
        type: Number,
        default: 0,
    },
    jobsApplied: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
    }],
    jobsCompleted: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
    }],
    insurance: {
        hasInsurance: Boolean,
        insuranceProvider: String,
        policyNumber: String,
        coverageAmount: Number,
        expirationDate: Date,
        documentUrl: String,
        isVerified: {
            type: Boolean,
            default: false,
        }
    }
    // Removed duplicated location field
});

// Check for models to avoid redefining them
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Only create the discriminator models if they don't already exist
const Customer = mongoose.models.customer || User.discriminator('customer', customerSchema);
const Tradesperson = mongoose.models.tradesperson || User.discriminator('tradesperson', tradespersonSchema);
const Admin = mongoose.models.admin || User.discriminator('admin', new mongoose.Schema({}));

export { User, Customer, Tradesperson, Admin };