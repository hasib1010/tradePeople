"use client"
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import io from 'socket.io-client';
import { refreshUnreadCount } from '@/components/common/Navbar';

export default function MessagesPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login?callbackUrl=/messages');
    },
  });

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for mobile sidebar toggle

  // Fetch Conversations
  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations?t=' + new Date().getTime());
      if (!response.ok) throw new Error('Failed to load conversations');

      const data = await response.json();
      setConversations(data.conversations || []);

      // Set first conversation as active if none selected
      if (data.conversations?.length > 0 && !activeConversation) {
        handleSelectConversation(data.conversations[0]);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.message);
    }
  }, [activeConversation]);

  // Mark Conversation as Read
  const markConversationAsRead = useCallback(async (conversationId) => {
    try {
      // Emit socket event to mark as read
      socket?.emit('mark-conversation-read', {
        conversationId,
        userId: session.user.id
      });

      // Call API to update database
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          userId: session.user.id
        })
      });

      // Update local state to reflect read messages
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv.user._id === conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );

      // Refresh unread count
      refreshUnreadCount();
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }, [socket, session]);

  // Socket.IO Setup 
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      const socketInstance = io('/', {
        path: '/api/socket',
        addTrailingSlash: false,
        auth: {
          token: session.user.id
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      socketInstance.on('connect', () => {
        console.log('Connected to Socket.IO server');
      });

      socketInstance.on('error', (error) => {
        console.error('Socket.IO error:', error);
      });

      const handleNewMessage = (message) => {
        console.log('Received new message:', message);

        // Check if the message is relevant to the current conversation
        const isRelevantMessage =
          activeConversation && (
            (message.sender === activeConversation.user._id && message.recipient === session.user.id) ||
            (message.sender === session.user.id && message.recipient === activeConversation.user._id) ||
            (activeConversation.application && message.application === activeConversation.application._id)
          );

        // Always update conversations
        fetchConversations();

        // Update messages if relevant
        if (isRelevantMessage) {
          setMessages(prevMessages => {
            // Prevent duplicate messages
            const isDuplicate = prevMessages.some(m => m._id === message._id);
            return isDuplicate ? prevMessages : [...prevMessages, message];
          });
        }
      };

      socketInstance.on('new-message', handleNewMessage);

      socketInstance.on('messages-read', ({ conversationId }) => {
        setConversations(prevConversations =>
          prevConversations.map(conv =>
            conv.user._id === conversationId
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      });

      socketInstance.on('update-unread-count', () => {
        refreshUnreadCount();
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.off('new-message', handleNewMessage);
        socketInstance.off('messages-read');
        socketInstance.off('update-unread-count');
        socketInstance.disconnect();
      };
    }
  }, [
    status,
    session?.user?.id,
    activeConversation?.user._id,
    fetchConversations
  ]);

  // Initial conversations load
  useEffect(() => {
    if (status === "authenticated") {
      setLoading(true);
      fetchConversations()
        .finally(() => setLoading(false));
    }
  }, [status, fetchConversations]);

  // Handle conversation selection 
  const handleSelectConversation = useCallback(async (conversation) => {
    setActiveConversation(conversation);
    setLoadingMessages(true);

    try {
      // Mark messages as read if needed
      if (conversation.unreadCount > 0 && socket) {
        await markConversationAsRead(conversation.user._id);
      }

      // Fetch messages for the selected conversation
      const endpoint = conversation.application
        ? `/api/messages?applicationId=${conversation.application._id}`
        : `/api/messages?userId=${conversation.user._id}`;

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to load messages');

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError(err.message);
    } finally {
      setLoadingMessages(false);
      setIsSidebarOpen(false); // Close sidebar on mobile after selecting a conversation
    }
  }, [socket, markConversationAsRead]);

  // Send message handler 
  const sendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !socket) return;

    setSendingMessage(true);
    try {
      const messageData = {
        sender: session.user.id,
        recipientId: activeConversation.user._id,
        content: newMessage,
        application: activeConversation.application?._id
      };

      // Optimistically add the message to the UI
      const optimisticMessage = {
        ...messageData,
        _id: `temp-${Date.now()}`, // Temporary ID
        createdAt: new Date().toISOString(),
        sender: { _id: session.user.id }
      };
      setMessages(prevMessages => [...prevMessages, optimisticMessage]);

      // Send via socket first
      socket.emit('send-message', messageData);

      // Then save to database
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();

      // Replace the optimistic message with the actual message from the server
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg._id.startsWith('temp-') ? data.message : msg
        )
      );

      // Clear input and reset sending state
      setNewMessage('');

      // Refresh conversations to update last message and unread counts
      fetchConversations();

    } catch (err) {
      console.error('Error sending message:', err);

      // Remove the optimistic message if sending fails
      setMessages(prevMessages =>
        prevMessages.filter(msg => !msg._id.startsWith('temp-'))
      );

      alert('Failed to send message: ' + err.message);
    } finally {
      setSendingMessage(false);
    }
  }, [newMessage, activeConversation, socket, session, fetchConversations]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format date helper (keep existing implementation)
  const formatDate = (dateString) => {
    if (!dateString) return '';

    const messageDate = new Date(dateString);
    const today = new Date();

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${messageDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    }

    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center p-8 max-w-md mx-auto">
          <svg className="h-16 w-16 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="mt-4 text-2xl font-bold text-gray-800">Error Loading Messages</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="h-screen flex flex-col md:flex-row overflow-hidden">
          {/* Mobile Sidebar Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-4 bg-blue-600 text-white"
          >
            {isSidebarOpen ? 'Close' : 'Open'} Conversations
          </button>

          {/* Conversations Sidebar */}
          <div className={`${isSidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-80 border-r border-gray-200 bg-white flex-shrink-0`}>
            <div className="h-fit flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversations.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {conversations.map((conversation) => (
                      <li
                        key={conversation.user._id}
                        className={`${activeConversation?.user._id === conversation.user._id
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                          } cursor-pointer`}
                        onClick={() => handleSelectConversation(conversation)}
                      >
                        <div className="px-4 py-4 flex items-center">
                          <div className="relative flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={conversation.user?.profileImage || "https://i.ibb.co.com/HfL0Fr7P/default-profile.jpg"}
                              alt={conversation.user?.firstName}
                            />
                            {conversation.unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {conversation.user?.firstName} {conversation.user?.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(conversation.lastMessage?.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-500 truncate">
                                {conversation.lastMessage?.sender === session.user.id ? 'You: ' : ''}
                                {conversation.lastMessage?.content}
                              </p>
                              {conversation.application && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  Job
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <svg className="h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">No conversations yet</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Start messaging tradespeople by viewing job applications or tradesperson profiles.
                    </p>
                    <Link
                      href="/dashboard"
                      className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Go to Dashboard
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {activeConversation ? (
              <>
                {/* Conversation Header */}
                <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={activeConversation.user?.profileImage || "https://i.ibb.co.com/HfL0Fr7P/default-profile.jpg"}
                        alt={activeConversation.user?.firstName}
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {activeConversation.user?.firstName} {activeConversation.user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activeConversation.user?.role === 'tradesperson'
                            ? 'Tradesperson'
                            : activeConversation.user?.role === 'customer'
                              ? 'Customer'
                              : activeConversation.user?.role}
                          {activeConversation.application &&
                            ' • ' + (activeConversation.application.job?.title || 'Job Application')}
                        </p>
                      </div>
                    </div>

                    <div>
                      {activeConversation.application && (
                        <Link
                          href={`/applications/${activeConversation.application._id}`}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          View Job Application
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((message, index) => {
                        const isCurrentUser = message.sender._id === session.user.id;
                        const showDate = index === 0 ||
                          new Date(message.createdAt).toDateString() !==
                          new Date(messages[index - 1].createdAt).toDateString();

                        return (
                          <div key={message._id}>
                            {showDate && (
                              <div className="flex justify-center my-4">
                                <div className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
                                  {new Date(message.createdAt).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                              </div>
                            )}

                            <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                              <div className={`flex max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                <div className="flex-shrink-0">
                                  <img
                                    className="h-8 w-8 rounded-full"
                                    src={message.sender?.profileImage || "https://i.ibb.co.com/HfL0Fr7P/default-profile.jpg"}
                                    alt={message.sender?.firstName}
                                  />
                                </div>
                                <div className={`relative mx-2 px-8 py-2 ${isCurrentUser
                                  ? 'bg-blue-600 rounded-3xl rounded-tr-none text-white'
                                  : 'bg-white rounded-3xl rounded-tl-none text-gray-800 border border-gray-200'
                                  }`}>
                                  <p className="text-sm">{message.content}</p>
                                  <span className={` text-[10px] border-t mt-1 ${isCurrentUser ? 'text-blue-200 border-blue-200' : 'text-gray-500'}`}>
                                    {formatDate(message.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">No messages yet</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Send a message to start the conversation
                      </p>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
                  <form onSubmit={sendMessage} className="flex space-x-3">
                    <div className="flex-grow">
                      <textarea
                        rows="1"
                        className="block border p-4 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm resize-none"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(e);
                          }
                        }}
                        disabled={sendingMessage}
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={sendingMessage || !newMessage.trim()}
                    >
                      {sendingMessage ? (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                      )}
                      Send
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-gray-50">
                <svg className="h-16 w-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h2 className="mt-2 text-lg font-medium text-gray-900">No conversation selected</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {conversations.length > 0
                    ? 'Select a conversation from the sidebar to start messaging'
                    : 'Your messages will appear here once you start a conversation'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}