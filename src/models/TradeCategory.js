// src/models/TradeCategory.js
import mongoose from 'mongoose';

const tradeCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    default: 'default-icon'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0 // For controlling the display order on the frontend
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Add debugging to check model registration
let TradeCategory;
try {
  // Check if the model already exists
  if (mongoose.models && mongoose.models.TradeCategory) {
    console.log("Using existing TradeCategory model");
    TradeCategory = mongoose.models.TradeCategory;
  } else {
    console.log("Creating new TradeCategory model");
    TradeCategory = mongoose.model('TradeCategory', tradeCategorySchema);
  }
} catch (error) {
  console.error("Error creating TradeCategory model:", error);
  // Try again with a different approach if there was an error
  if (mongoose.connection.readyState === 1) {
    console.log("Mongoose is connected, forcing model creation");
    try {
      // If model exists but had an issue, try to overwrite it (development only)
      if (process.env.NODE_ENV === 'development' && mongoose.models.TradeCategory) {
        delete mongoose.models.TradeCategory;
      }
      TradeCategory = mongoose.model('TradeCategory', tradeCategorySchema);
    } catch (retryError) {
      console.error("Failed to create TradeCategory model on retry:", retryError);
      // Last resort, try a simpler approach
      TradeCategory = mongoose.models.TradeCategory || mongoose.model('TradeCategory', tradeCategorySchema);
    }
  } else {
    // If mongoose isn't connected, just use the simple approach
    TradeCategory = mongoose.models.TradeCategory || mongoose.model('TradeCategory', tradeCategorySchema);
  }
}

export default TradeCategory;