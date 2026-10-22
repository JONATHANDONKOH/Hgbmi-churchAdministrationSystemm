import { useMemo, useState } from 'react';
import SearchBar from '../../component/searchBar';
import '../../styles/administrationManagement.css';

const fellowshipData = [
  { name: 'Grace Fellowship', leader: 'David Mensah', members: 42, status: 'Active' },
  { name: 'Joy Fellowship', leader: 'Joshua Nkrumah', members: 38, status: 'Active' },
  { name: 'Mercy Fellowship', leader: 'Ruth Addai', members: 31, status: 'Active' },
  { name: 'Hope Fellowship', leader: 'Samuel Boateng', members: 27, status: 'On leave' },
  { name: 'Kingdom Fellowship', leader: 'Mary Johnson', members: 35, status: 'Active' },
  { name: 'Victory Fellowship', leader: 'Faith Okafor', members: 29, status: 'Active' },
];

export default function AdministrationFellowship() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFellowships = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return fellowshipData.filter((item) =>
      !query || `${item.name} ${item.leader}`.toLowerCase().includes(query)
    );
  }, [searchTerm]);

  const totalMembers = fellowshipData.reduce((sum, item) => sum + item.members, 0);
  const activeCount = fellowshipData.filter((item) => item.status === 'Active').length;

  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Administration</p>
          <h1 className="administration-title">Fellowship</h1>
        </div>

        <div className="fellowship-member-search">
          <SearchBar
            placeholder="Search fellowship"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </header>

      <section className="administration-stats" aria-label="Fellowship statistics">
        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Total fellowship</p>
          <p className="administration-card-value">{fellowshipData.length}</p>
          <p className="administration-card-detail">Registered fellowships</p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Active</p>
          <p className="administration-card-value">{activeCount}</p>
          <p className="administration-card-detail">Currently active</p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Members</p>
          <p className="administration-card-value">{totalMembers}</p>
          <p className="administration-card-detail">Across all fellowships</p>
        </article>
      </section>

      <section className="fellowship-member-panel" aria-label="Fellowship list">
        <div className="fellowship-member-panel-header">
          <h2>Fellowship directory</h2>
          <span>{filteredFellowships.length} total</span>
        </div>

        <div className="admin-grid-list">
          {filteredFellowships.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', color: '#64748b', padding: '8px 0' }}>
              No fellowship matches your search.
            </div>
          ) : (
            filteredFellowships.map((item) => (
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
