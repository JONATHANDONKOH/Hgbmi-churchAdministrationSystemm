import { useEffect, useMemo, useState } from 'react';
import SearchBar from '../../component/searchBar';
import '../../styles/administrationManagement.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SuperAdminFellowships() {
  const [searchTerm, setSearchTerm] = useState('');
  const [fellowshipData, setFellowshipData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadFellowships = async () => {
      try {
        const response = await fetch(`${API_URL}/super-admin/fellowships`, {
          credentials: 'include',
          signal: controller.signal,
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error || payload?.message || 'Failed to load fellowships');
        }

        const items = Array.isArray(payload?.data) ? payload.data : [];

        setFellowshipData(
          items.map((item) => ({
            id: item.id,
            name: item.name || 'Unnamed fellowship',
            leader: item.leader || item.leader_name || 'Not assigned',
            members: Number(item.members ?? item.member_count ?? 0),
            status: item.status || (item.is_active === false ? 'Inactive' : 'Active'),
          }))
        );
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadFellowships();

    return () => controller.abort();
  }, []);

  const filteredFellowships = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return fellowshipData.filter((item) =>
      !query || `${item.name} ${item.leader}`.toLowerCase().includes(query)
    );
  }, [fellowshipData, searchTerm]);

  const activeCount = fellowshipData.filter((item) => item.status === 'Active').length;
  const totalMembers = fellowshipData.reduce((sum, item) => sum + Number(item.members || 0), 0);

  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Super admin</p>
          <h1 className="administration-title">Fellowships</h1>
        </div>

        <div className="fellowship-member-search">
          <SearchBar
            placeholder="Search fellowships"
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
          <span>{loading ? 'Loading...' : `${filteredFellowships.length} total`}</span>
        </div>

        <div className="admin-grid-list">
          {loading ? (
            <div style={{ gridColumn: '1 / -1', color: '#64748b', padding: '8px 0' }}>
              Loading fellowships...
            </div>
          ) : error ? (
            <div role="alert" style={{ gridColumn: '1 / -1', color: '#b91c1c', padding: '8px 0' }}>
              {error}
            </div>
          ) : filteredFellowships.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', color: '#64748b', padding: '8px 0' }}>
              {fellowshipData.length === 0
                ? 'No fellowships have been created yet.'
                : 'No fellowship matches your search.'}
            </div>
          ) : (
            filteredFellowships.map((item) => (
              <article key={item.id ?? item.name} className="admin-grid-item">
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
                <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>{item.name}</p>
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