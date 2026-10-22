import { useMemo, useState } from 'react';
import SearchBar from '../../component/searchBar';
import '../../styles/administrationManagement.css';

const messages = [
  { sender: 'Pastor Mensah', subject: 'Weekly update', time: '09:15 AM', status: 'Unread' },
  { sender: 'Events Team', subject: 'Youth program', time: 'Yesterday', status: 'Read' },
  { sender: 'Finance Office', subject: 'Budget review', time: 'Mon', status: 'Unread' },
  { sender: 'Cell Leaders', subject: 'Attendance report', time: 'Sun', status: 'Read' },
  { sender: 'Prayer Team', subject: 'New prayer schedule', time: 'Fri', status: 'Unread' },
  { sender: 'Media Team', subject: 'Volunteer briefing', time: 'Thu', status: 'Read' },
];

export default function SuperAdminMessages() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMessages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return messages.filter((item) =>
      !query || `${item.sender} ${item.subject}`.toLowerCase().includes(query)
    );
  }, [searchTerm]);

  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Super admin</p>
          <h1 className="administration-title">Messages</h1>
        </div>

        <div className="fellowship-member-search">
          <SearchBar
            placeholder="Search messages"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </header>

      <section className="administration-stats" aria-label="Messages overview">
        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Total</p>
          <p className="administration-card-value">{messages.length}</p>
          <p className="administration-card-detail">Inbox items</p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Unread</p>
          <p className="administration-card-value">{messages.filter((item) => item.status === 'Unread').length}</p>
          <p className="administration-card-detail">Needs attention</p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Read</p>
          <p className="administration-card-value">{messages.filter((item) => item.status === 'Read').length}</p>
          <p className="administration-card-detail">Already reviewed</p>
        </article>
      </section>

      <section className="fellowship-member-panel" aria-label="Messages list">
        <div className="fellowship-member-panel-header">
          <h2>Messages inbox</h2>
          <span>{filteredMessages.length} total</span>
        </div>

        <div className="admin-grid-list">
          {filteredMessages.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', color: '#64748b', padding: '8px 0' }}>
              No message matches your search.
            </div>
          ) : (
            filteredMessages.map((item) => (
              <article key={`${item.sender}-${item.subject}`} className="admin-grid-item">
                <div className="admin-grid-item-top">
                  <div className="fellowship-member-avatar" style={{ width: '42px', height: '42px' }}>
                    {item.sender.charAt(0)}
                  </div>
                  <span
                    className={`fellowship-member-status ${
                      item.status === 'Unread' ? 'status-absent' : 'status-present'
                    }`}
                    style={{ minWidth: '88px' }}
                  >
                    {item.status}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>{item.subject}</p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>From: {item.sender}</p>
                <div className="admin-grid-item-body">
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Time</span>
                  <strong style={{ color: '#111827', fontSize: '1.1rem' }}>{item.time}</strong>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
