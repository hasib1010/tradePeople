// src/lib/socketClient.js
import io from 'socket.io-client';

let socket;

export const initSocket = (userId) => {
  if (!socket) {
    socket = io('/', {
      path: '/api/socket',
      auth: {
        token: userId
      }
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};