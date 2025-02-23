// src/config/socket.js
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  NEW_MESSAGE: 'new-message',
  SEND_MESSAGE: 'send-message',
  MARK_READ: 'mark-read',
  MESSAGES_READ: 'messages-read',
  UPDATE_UNREAD_COUNT: 'update-unread-count',
  MARK_CONVERSATION_READ: 'mark-conversation-read'
};