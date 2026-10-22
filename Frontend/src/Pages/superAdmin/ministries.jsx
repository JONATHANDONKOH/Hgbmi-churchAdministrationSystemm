import { useEffect, useMemo, useState } from 'react';
import SearchBar from '../../component/searchBar';
import '../../styles/administrationManagement.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SuperAdminMinistries() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ministriesData, setMinistriesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadMinistries = async () => {
      try {
        const response = await fetch(`${API_URL}/super-admin/ministries`, {
          credentials: 'include',
          signal: controller.signal,
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error || payload?.message || 'Failed to load ministries');
        }

        const items = Array.isArray(payload?.data) ? payload.data : [];

        setMinistriesData(
          items.map((item) => ({
            id: item.id,
            name: item.name || 'Unnamed ministry',
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

    loadMinistries();

    return () => controller.abort();
  }, []);

  const filteredMinistries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return ministriesData.filter((item) =>
      !query || `${item.name} ${item.leader}`.toLowerCase().includes(query)
    );
  }, [ministriesData, searchTerm]);

  const activeCount = ministriesData.filter((item) => item.status === 'Active').length;
  const totalMembers = ministriesData.reduce((sum, item) => sum + Number(item.members || 0), 0);

  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Super admin</p>
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
          <span>{loading ? 'Loading...' : `${filteredMinistries.length} total`}</span>
        </div>

        <div className="admin-grid-list">
          {loading ? (
            <div style={{ gridColumn: '1 / -1', color: '#64748b', padding: '8px 0' }}>
              Loading ministries...
            </div>
          ) : error ? (
            <div role="alert" style={{ gridColumn: '1 / -1', color: '#b91c1c', padding: '8px 0' }}>
              {error}
            </div>
          ) : filteredMinistries.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', color: '#64748b', padding: '8px 0' }}>
              {ministriesData.length === 0
                ? 'No ministries have been created yet.'
                : 'No ministry matches your search.'}
            </div>
          ) : (
            filteredMinistries.map((item) => (
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