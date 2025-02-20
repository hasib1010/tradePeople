// models/Conversation.js
import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  },
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    sentAt: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastReadAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    isJobRelated: {
      type: Boolean,
      default: false
    },
    initiatedFrom: {
      type: String,
      enum: ['job', 'profile', 'application', 'admin', 'system'],
    }
  }
}, {
  timestamps: true
});

// Add indexes for efficient querying
conversationSchema.index({ participants: 1 });
conversationSchema.index({ job: 1 });
conversationSchema.index({ 'lastMessage.sentAt': -1 });
conversationSchema.index({ updatedAt: -1 });

// Pre-save middleware to set isJobRelated based on job field
conversationSchema.pre('save', function(next) {
  if (this.job) {
    this.metadata.isJobRelated = true;
  }
  next();
});

// Static method to find conversations for a user
conversationSchema.statics.findForUser = function(userId) {
  return this.find({ participants: userId })
    .sort({ 'lastMessage.sentAt': -1 })
    .populate('participants', 'firstName lastName profileImage')
    .populate('lastMessage.sender', 'firstName lastName');
};

// Instance method to mark conversation as read by a user
conversationSchema.methods.markAsReadBy = async function(userId) {
  const readUser = this.readBy.find(item => item.user.toString() === userId.toString());
  
  if (readUser) {
    readUser.lastReadAt = new Date();
  } else {
    this.readBy.push({
      user: userId,
      lastReadAt: new Date()
    });
  }
  
  return this.save();
};

// Virtual for unread messages count for a specific user
conversationSchema.virtual('unreadCount').get(function() {
  // This will be implemented when messages are retrieved
  return 0;
});

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

export default Conversation;