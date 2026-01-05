import React, { useState, useEffect, useRef } from 'react';
import { supportAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import './Support.css';

const Chat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await supportAPI.getConversations();
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await supportAPI.getMessages(userId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedUser) return;

    try {
      setSending(true);
      const response = await supportAPI.sendMessage({
        recipientId: selectedUser._id,
        content: newMessage.trim()
      });
      
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      
      // Update conversation list
      setConversations(prev => {
        const existing = prev.find(c => c.user._id === selectedUser._id);
        if (existing) {
          return prev.map(c => 
            c.user._id === selectedUser._id 
              ? { ...c, lastMessage: response.data }
              : c
          );
        }
        return [...prev, { user: selectedUser, lastMessage: response.data, unreadCount: 0 }];
      });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 86400000) {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="chat-container">
      <div className="conversations-list">
        <h3>Conversations</h3>
        {loading ? (
          <div className="loading-small">Loading...</div>
        ) : conversations.length === 0 ? (
          <p className="no-conversations">No conversations yet</p>
        ) : (
          conversations.map(conv => (
            <button
              key={conv.user._id}
              className={`conversation-item ${selectedUser?._id === conv.user._id ? 'active' : ''}`}
              onClick={() => setSelectedUser(conv.user)}
            >
              <div className="conv-avatar">
                {conv.user.profilePhoto ? (
                  <img src={conv.user.profilePhoto} alt={conv.user.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {conv.user.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <div className="conv-info">
                <span className="conv-name">{conv.user.name}</span>
                <span className="conv-preview">
                  {conv.lastMessage?.content?.substring(0, 30)}
                  {conv.lastMessage?.content?.length > 30 ? '...' : ''}
                </span>
              </div>
              {conv.unreadCount > 0 && (
                <span className="unread-count">{conv.unreadCount}</span>
              )}
            </button>
          ))
        )}
      </div>

      <div className="chat-area">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="chat-user-info">
                {selectedUser.profilePhoto ? (
                  <img src={selectedUser.profilePhoto} alt={selectedUser.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {selectedUser.name?.charAt(0) || '?'}
                  </div>
                )}
                <div>
                  <span className="chat-user-name">{selectedUser.name}</span>
                  <span className="chat-user-role">{selectedUser.role}</span>
                </div>
              </div>
            </div>

            <div className="messages-area">
              {messages.map(msg => (
                <div 
                  key={msg._id} 
                  className={`message ${msg.sender._id === user._id ? 'sent' : 'received'}`}
                >
                  <div className="message-content">{msg.content}</div>
                  <span className="message-time">{formatTime(msg.createdAt)}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="message-input-area">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
              />
              <button type="submit" disabled={sending || !newMessage.trim()}>
                {sending ? '...' : '➤'}
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
