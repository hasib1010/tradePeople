// src/models/Message.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  // Optional reference to a job application
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    default: null
  },
  // Optional reference to a job
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  // Optional attachments
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }]
}, {
  timestamps: true
});

// Add indexes for faster querying
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ application: 1 });
messageSchema.index({ job: 1 });
messageSchema.index({ read: 1 });
messageSchema.index({ createdAt: 1 });

// Add a method to mark a message as read
messageSchema.methods.markAsRead = async function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    return this.save();
  }
  return this;
};

// Create a model function to get unread messages count for a user
messageSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    recipient: userId,
    read: false
  });
};

// Create a model function to mark all messages in a conversation as read
messageSchema.statics.markConversationAsRead = async function(userId, otherUserId) {
  return this.updateMany(
    {
      recipient: userId,
      sender: otherUserId,
      read: false
    },
    {
      $set: { 
        read: true,
        readAt: new Date()
      }
    }
  );
};

// Create a model function to get recent conversations
messageSchema.statics.getRecentConversations = async function(userId) {
  // Get the last message from each conversation
  const conversations = await this.aggregate([
    {
      $match: {
        $or: [
          { sender: mongoose.Types.ObjectId(userId) },
          { recipient: mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ["$sender", mongoose.Types.ObjectId(userId)] },
            "$recipient",
            "$sender"
          ]
        },
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              { 
                $and: [
                  { $eq: ["$recipient", mongoose.Types.ObjectId(userId)] },
                  { $eq: ["$read", false] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $sort: { "lastMessage.createdAt": -1 }
    }
  ]);

  // Get user details for each conversation partner
  const populatedConversations = await Promise.all(
    conversations.map(async (conv) => {
      const user = await mongoose.model('User').findById(conv._id, 'firstName lastName profileImage role');
      return {
        ...conv,
        user
      };
    })
  );

  return populatedConversations;
};

// Check if Message model exists before creating
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;