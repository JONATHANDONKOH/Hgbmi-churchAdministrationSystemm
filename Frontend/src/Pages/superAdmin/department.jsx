import { useEffect, useMemo, useState } from 'react';
import SearchBar from '../../component/searchBar';
import '../../styles/administrationManagement.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SuperAdminDepartment() {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentData, setDepartmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadDepartments = async () => {
      try {
        const response = await fetch(`${API_URL}/super-admin/departments`, {
          credentials: 'include',
          signal: controller.signal,
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error || payload?.message || 'Failed to load departments');
        }

        const items = Array.isArray(payload?.data) ? payload.data : [];

        setDepartmentData(
          items.map((item) => ({
            id: item.id,
            name: item.name || 'Unnamed department',
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

    loadDepartments();

    return () => controller.abort();
  }, []);

  const filteredDepartments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return departmentData.filter((item) =>
      !query || `${item.name} ${item.leader}`.toLowerCase().includes(query)
    );
  }, [departmentData, searchTerm]);

  const leaderCount = departmentData.filter((item) => item.leader !== 'Not assigned').length;
  const totalMembers = departmentData.reduce((sum, item) => sum + Number(item.members || 0), 0);

  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Superadmin</p>
          <h1 className="administration-title">Departments</h1>
        </div>

        <div className="fellowship-member-search">
          <SearchBar
            placeholder="Search departments"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </header>

      <section className="administration-stats" aria-label="Department overview">
        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Departments</p>
          <p className="administration-card-value">{departmentData.length}</p>
          <p className="administration-card-detail">Active departments</p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Leaders</p>
          <p className="administration-card-value">{leaderCount}</p>
          <p className="administration-card-detail">Assigned leaders</p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Members</p>
          <p className="administration-card-value">{totalMembers}</p>
          <p className="administration-card-detail">Across all departments</p>
        </article>
      </section>

      <section className="fellowship-member-panel" aria-label="Department list">
        <div className="fellowship-member-panel-header">
          <h2>Department directory</h2>
          <span>{loading ? 'Loading...' : `${filteredDepartments.length} total`}</span>
        </div>

        <div className="admin-grid-list">
          {loading ? (
            <div style={{ gridColumn: '1 / -1', color: '#64748b', padding: '8px 0' }}>
              Loading departments...
            </div>
          ) : error ? (
            <div role="alert" style={{ gridColumn: '1 / -1', color: '#b91c1c', padding: '8px 0' }}>
              {error}
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', color: '#64748b', padding: '8px 0' }}>
              {departmentData.length === 0
                ? 'No departments have been created yet.'
                : 'No department matches your search.'}
            </div>
          ) : (
            filteredDepartments.map((item) => (
              <article key={item.id ?? item.name} className="admin-grid-item">
                <div className="admin-grid-item-top">
                  <div className="fellowship-member-avatar" style={{ width: '42px', height: '42px' }}>
                    {item.name.charAt(0)}
                  </div>
                  <span className="fellowship-member-status status-present" style={{ minWidth: '88px' }}>
                    Active
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