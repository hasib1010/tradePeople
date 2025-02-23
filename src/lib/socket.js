// src/lib/socket.js
import { Server } from 'socket.io';
import { createServer } from 'http';
import { NextResponse } from 'next/server';

let globalServer = null;
let io = null;

const initSocketServer = () => {
    if (globalServer) return io;

    const httpServer = createServer();
    io = new Server(httpServer, {
        path: '/api/socket',
        addTrailingSlash: false,
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.handshake.auth?.token;
        console.log('Client connected:', socket.id, 'User ID:', userId);


        // Join user's personal room
        if (userId) {
            socket.join(userId);
        }

        socket.on('typing', ({ recipientId, isTyping }) => {
            // Broadcast typing status to the recipient
            socket.to(recipientId).emit('typing', {
                userId: socket.handshake.auth.token,
                isTyping
            });
        });
        
        socket.on('join', (roomId) => {
            socket.join(roomId);
            console.log(`User ${userId} joined room: ${roomId}`);
        });

        socket.on('send-message', (messageData) => {
            try {
                // Broadcast to recipient
                if (messageData.recipientId) {
                    io.to(messageData.recipientId).emit('new-message', {
                        ...messageData,
                        createdAt: new Date().toISOString()
                    });
                }

                // Broadcast to application room if applicable
                if (messageData.application) {
                    io.to(`application-${messageData.application}`).emit('new-message', {
                        ...messageData,
                        createdAt: new Date().toISOString()
                    });
                }
            } catch (error) {
                console.error('Error in send-message event:', error);
            }
        });

        socket.on('mark-conversation-read', ({ conversationId, userId }) => {
            try {
                io.to(conversationId).emit('messages-read', { conversationId });
                io.to(userId).emit('update-unread-count');
            } catch (error) {
                console.error('Error in mark-conversation-read event:', error);
            }
        });
        socket.on('mark-conversation-read', async ({ conversationId, userId }) => {
            try {
                // Broadcast to all clients in the conversation
                io.to(conversationId).emit('messages-read', { conversationId });

                // Trigger unread count update
                io.to(userId).emit('update-unread-count');
            } catch (error) {
                console.error('Error in mark-conversation-read event:', error);
            }
        });

        socket.on('mark-read', ({ messageId, conversationId }) => {
            try {
                io.to(conversationId).emit('message-read', { messageId });
            } catch (error) {
                console.error('Error in mark-read event:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    httpServer.listen(0); // Use a random available port
    globalServer = httpServer;

    return io;
};

export async function socketHandler(req) {
    try {
        const socketServer = initSocketServer();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Socket initialization error:', error);
        return NextResponse.json({
            error: 'Socket initialization failed',
            details: error.message
        }, { status: 500 });
    }
}
