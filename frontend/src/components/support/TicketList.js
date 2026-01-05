import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supportAPI } from '../../utils/api';
import './Support.css';

const TicketList = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = filter ? { status: filter } : {};
      const response = await supportAPI.getMyTickets(params);
      setTickets(response.data.tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'status-open';
      case 'in_progress': return 'status-progress';
      case 'resolved': return 'status-resolved';
      case 'closed': return 'status-closed';
      default: return '';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="tickets-container">
      <div className="tickets-header">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === '' ? 'active' : ''}`}
            onClick={() => setFilter('')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'open' ? 'active' : ''}`}
            onClick={() => setFilter('open')}
          >
            Open
          </button>
          <button 
            className={`filter-btn ${filter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setFilter('in_progress')}
          >
            In Progress
          </button>
          <button 
            className={`filter-btn ${filter === 'resolved' ? 'active' : ''}`}
            onClick={() => setFilter('resolved')}
          >
            Resolved
          </button>
        </div>
        <Link to="/support/tickets/new" className="btn-new-ticket">
          + New Ticket
        </Link>
      </div>

      {loading ? (
        <div className="loading">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="no-tickets">
          <p>You haven't created any support tickets yet.</p>
          <Link to="/support/tickets/new" className="btn-primary">Create Your First Ticket</Link>
        </div>
      ) : (
        <div className="tickets-list">
          {tickets.map(ticket => (
            <Link key={ticket._id} to={`/support/tickets/${ticket._id}`} className="ticket-card">
              <div className="ticket-header">
                <span className="ticket-priority" title={ticket.priority}>
                  {getPriorityIcon(ticket.priority)}
                </span>
                <h3 className="ticket-subject">{ticket.subject}</h3>
                <span className={`ticket-status ${getStatusColor(ticket.status)}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
              
              <p className="ticket-description">
                {ticket.description.substring(0, 100)}
                {ticket.description.length > 100 ? '...' : ''}
              </p>
              
              <div className="ticket-footer">
                <span className="ticket-category">{ticket.category}</span>
                <span className="ticket-date">Updated: {formatDate(ticket.updatedAt)}</span>
                {ticket.responses?.length > 0 && (
                  <span className="ticket-responses">
                    💬 {ticket.responses.length} responses
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketList;
