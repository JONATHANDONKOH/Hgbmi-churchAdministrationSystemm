import { useMemo, useState } from 'react';
import SearchBar from '../../component/searchBar';
import '../../styles/administrationManagement.css';

const ministriesData = [
  { name: 'Prayer Ministry', leader: 'Esther Amani', members: 24, status: 'Active' },
  { name: 'Music Ministry', leader: 'John Asamoah', members: 19, status: 'Active' },
  { name: 'Outreach Ministry', leader: 'Rita Akoto', members: 22, status: 'Active' },
  { name: 'Youth Ministry', leader: 'Daniel Mensah', members: 28, status: 'Active' },
  { name: 'Hospitality Ministry', leader: 'Naomi Appiah', members: 17, status: 'On leave' },
  { name: 'Children Ministry', leader: 'Grace Tetteh', members: 21, status: 'Active' },
];

export default function AdministrationMinistries() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMinistries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return ministriesData.filter((item) =>
      !query || `${item.name} ${item.leader}`.toLowerCase().includes(query)
    );
  }, [searchTerm]);

  const totalMembers = ministriesData.reduce((sum, item) => sum + item.members, 0);
  const activeCount = ministriesData.filter((item) => item.status === 'Active').length;

  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Administration</p>
          <h1 className="administration-title">Ministries</h1>
        </div>

        <div className="fellowship-member-search">
          <SearchBar
            placeholder="Search ministries"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </header>

      <section className="administration-stats" aria-label="Ministries overview">
        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Total ministries</p>
          <p className="administration-card-value">{ministriesData.length}</p>
          <p className="administration-card-detail">Registered ministries</p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Active</p>
          <p className="administration-card-value">{activeCount}</p>
          <p className="administration-card-detail">Currently running</p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Members</p>
          <p className="administration-card-value">{totalMembers}</p>
          <p className="administration-card-detail">Across all ministries</p>
        </article>
      </section>

      <section className="fellowship-member-panel" aria-label="Ministry list">
        <div className="fellowship-member-panel-header">
          <h2>Ministry directory</h2>
          <span>{filteredMinistries.length} total</span>
        </div>

        <div className="admin-grid-list">
          {filteredMinistries.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', color: '#64748b', padding: '8px 0' }}>
              No ministry matches your search.
            </div>
          ) : (
            filteredMinistries.map((item) => (
              <article key={item.name} className="admin-grid-item">
                <div className="admin-grid-item-top">
                  <div className="fellowship-member-avatar" style={{ width: '42px', height: '42px' }}>
                    {item.name.charAt(0)}
                  </div>
                  <span
                    className={`fellowship-member-status ${
                      item.status === 'Active' ? 'status-present' : 'status-absent'
                    }`}
                    style={{ minWidth: '88px' }}
                  >
                    {item.status}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>
                  {item.name}
                </p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Leader: {item.leader}</p>

                <div className="admin-grid-item-body">
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Members</span>
                  <strong style={{ color: '#111827', fontSize: '1.1rem' }}>{item.members}</strong>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
