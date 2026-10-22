import { useMemo, useState } from 'react';
import SearchBar from '../../component/searchBar';
import '../../styles/administrationManagement.css';

const cellsData = [
  { name: 'Grace Cell', leader: 'Evelyn Aidoo', members: 18, status: 'Active' },
  { name: 'Joy Cell', leader: 'Joseph Nartey', members: 16, status: 'Active' },
  { name: 'Mercy Cell', leader: 'Abena Kumi', members: 14, status: 'Active' },
  { name: 'Hope Cell', leader: 'Kofi Danso', members: 12, status: 'Active' },
  { name: 'Unity Cell', leader: 'Sandra Mensah', members: 10, status: 'On hold' },
  { name: 'Light Cell', leader: 'Daniel Owusu', members: 15, status: 'Active' },
  { name: 'Kingdom Cell', leader: 'Emmanuel Tetteh', members: 13, status: 'Active' },
  { name: 'Harvest Cell', leader: 'Mercy Asare', members: 11, status: 'Active' },
];

export default function AdministrationCells() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCells = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return cellsData.filter((item) =>
      !query || `${item.name} ${item.leader}`.toLowerCase().includes(query)
    );
  }, [searchTerm]);

  const totalMembers = cellsData.reduce((sum, item) => sum + item.members, 0);
  const activeCount = cellsData.filter((item) => item.status === 'Active').length;

  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Administration</p>
          <h1 className="administration-title">Cells</h1>
        </div>

        <div className="fellowship-member-search">
          <SearchBar
            placeholder="Search cells"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </header>

      <section className="administration-stats" aria-label="Cells overview">
        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Total cells</p>
          <p className="administration-card-value">{cellsData.length}</p>
          <p className="administration-card-detail">Registered cell groups</p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Active</p>
          <p className="administration-card-value">{activeCount}</p>
          <p className="administration-card-detail">Currently active</p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Members</p>
          <p className="administration-card-value">{totalMembers}</p>
          <p className="administration-card-detail">Across all cells</p>
        </article>
      </section>

      <section className="fellowship-member-panel" aria-label="Cells list">
        <div className="fellowship-member-panel-header">
          <h2>Cell directory</h2>
          <span>{filteredCells.length} total</span>
        </div>

        <div className="admin-grid-list">
          {filteredCells.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', color: '#64748b', padding: '8px 0' }}>
              No cell matches your search.
            </div>
          ) : (
            filteredCells.map((item) => (
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
