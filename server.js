// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Create the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Socket.IO event handlers
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Authenticate user using the token sent from client
    const userId = socket.handshake.auth.token;
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    }

    // Handle new message
    socket.on('send-message', async (messageData) => {
      console.log('New message received:', messageData);
      
      // Emit to recipient's room
      if (messageData.recipientId) {
        io.to(messageData.recipientId).emit('new-message', messageData);
      }

      // If message is related to an application, emit to application room
      if (messageData.application) {
        io.to(`application-${messageData.application}`).emit('new-message', messageData);
      }
    });

    // Handle marking messages as read
    socket.on('mark-conversation-read', ({ conversationId, userId }) => {
      // Emit to all user's connections that messages were read
      io.to(conversationId).emit('messages-read', { conversationId });
      
      // Emit to reader to update their unread count
      io.to(userId).emit('update-unread-count');
    });

    // Handle marking individual message as read
    socket.on('mark-read', ({ messageId, conversationId }) => {
      io.to(conversationId).emit('message-read', { messageId });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});