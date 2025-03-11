// src/models/TempUser.js
import mongoose from 'mongoose';
import crypto from 'crypto';

const tempUserSchema = new mongoose.Schema({
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
    },
    role: {
        type: String,
        enum: ['customer', 'tradesperson'],
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
    profileImage: String,
    location: {
        address: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
        // Default coordinates to avoid validation errors
        coordinates: {
            type: {
                type: String,
                default: "Point"
            },
            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        }
    },
    // For tradesperson specific data
    businessName: String,
    skills: [String],
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
            default: false, // Will need admin verification
        },
    }],
    serviceArea: {
        radius: Number,
        cities: [String],
    },
    insurance: {
        hasInsurance: Boolean,
        insuranceProvider: String,
        policyNumber: String,
        coverageAmount: Number,
        expirationDate: Date,
        documentUrl: String,
        isVerified: {
            type: Boolean,
            default: false, // Will need admin verification
        },
    },
    // Verification fields
    verificationToken: { 
        type: String,
        required: true 
    },
    verificationTokenExpires: { 
        type: Date,
        required: true 
    },
    // Tracking fields
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '48h' // Automatically remove documents after 48 hours if not verified
    }
});

// Generate verification token
tempUserSchema.methods.generateVerificationToken = function() {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    this.verificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
    
    // Token expires in 24 hours
    this.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    return verificationToken;
};

const TempUser = mongoose.models.TempUser || mongoose.model('TempUser', tempUserSchema);

export default TempUser;