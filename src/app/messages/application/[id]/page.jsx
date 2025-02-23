"use client"
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function ApplicationMessagingPage() {
  const { id } = useParams(); // application ID
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push(`/login?callbackUrl=/messages/application/${id}`);
    },
  });

  const [application, setApplication] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch application and messages data
  useEffect(() => {
    if (status === "authenticated") {
      const fetchData = async () => {
        try {
          // Fetch application details
          const applicationResponse = await fetch(`/api/applications/${id}`);
          if (!applicationResponse.ok) {
            throw new Error('Failed to load application details');
          }
          const applicationData = await applicationResponse.json();
          setApplication(applicationData);
          
          // Fetch messages for this application
          const messagesResponse = await fetch(`/api/messages?applicationId=${id}`);
          if (!messagesResponse.ok) {
            throw new Error('Failed to load messages');
          }
          const messagesData = await messagesResponse.json();
          setMessages(messagesData.messages || []);
          
          // Mark messages as read
          if (messagesData.messages && messagesData.messages.length > 0) {
            try {
              await fetch(`/api/applications/${id}/messages/read`, {
                method: 'POST',
              });
              // This will update the unread count on the next poll
            } catch (err) {
              console.error('Error marking messages as read:', err);
            }
          }
          
          setLoading(false);
        } catch (err) {
          console.error('Error fetching data:', err);
          setError(err.message);
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [id, status]);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up polling for new messages every 10 seconds
  useEffect(() => {
    if (!loading && application) {
      const intervalId = setInterval(async () => {
        try {
          const messagesResponse = await fetch(`/api/messages?applicationId=${id}`);
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            
            // If there are new messages, mark them as read
            if (messagesData.messages && messagesData.messages.length > messages.length) {
              try {
                await fetch(`/api/applications/${id}/messages/read`, {
                  method: 'POST',
                });
              } catch (err) {
                console.error('Error marking messages as read:', err);
              }
            }
            
            setMessages(messagesData.messages || []);
          }
        } catch (err) {
          console.error('Error polling messages:', err);
        }
      }, 10000); // Poll every 10 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [id, loading, application, messages.length]);

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    setSendingMessage(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationId: id,
          content: newMessage,
          recipientId: isCustomer 
            ? application.tradesperson._id 
            : application.job.customer._id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // Add the new message to the list
      setMessages(prevMessages => [...prevMessages, data.message]);
      setNewMessage('');
      
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message: ' + err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const messageDate = new Date(dateString);
    const today = new Date();
    
    // Check if the message was sent today
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Check if the message was sent yesterday
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${messageDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    
    // Otherwise, show full date
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center p-8 max-w-md mx-auto">
          <svg className="h-16 w-16 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="mt-4 text-2xl font-bold text-gray-800">Error Loading Messages</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!application) return null;

  const isCustomer = session?.user?.id === application.job.customer._id;
  const otherUser = isCustomer ? application.tradesperson : application.job.customer;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col h-screen -my-8">
          {/* Header */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 py-4 px-4 md:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => router.back()}
                  className="mr-4 inline-flex items-center text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <img 
                      className="h-10 w-10 rounded-full" 
                      src={otherUser?.profileImage || "https://i.ibb.co.com/HfL0Fr7P/default-profile.jpg"} 
                      alt={otherUser?.firstName} 
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {otherUser?.firstName} {otherUser?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isCustomer ? 'Tradesperson' : 'Job Customer'} • {application.job.title}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <Link
                  href={isCustomer 
                    ? `/tradespeople/${application.tradesperson._id}` 
                    : `/customers/${application.job.customer._id}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View Profile
                </Link>
                <Link
                  href={`/applications/${application._id}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View Application
                </Link>
              </div>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
            <div className="space-y-4">
              {/* Application status notification */}
              <div className="flex justify-center">
                <div className={`px-4 py-2 rounded-full text-xs text-center ${
                  application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  application.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                  application.status === 'withdrawn' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  Application status: {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </div>
              </div>
              
              {/* Messages list */}
              {messages.length > 0 ? (
                messages.map((message, index) => {
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
                          <div className={`relative mx-2 px-4 py-2 rounded-lg ${
                            isCurrentUser 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <span className={`block text-xs mt-1 ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}`}>
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No messages yet. Start a conversation!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Message input */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
            <form onSubmit={sendMessage} className="flex space-x-3">
              <div className="flex-grow">
                <textarea
                  rows="1"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm resize-none"
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
        </div>
      </div>
    </div>
  );
}