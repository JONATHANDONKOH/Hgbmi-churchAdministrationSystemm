import { useEffect, useMemo, useState } from 'react';
import SearchBar from '../../component/searchBar';
import '../../styles/administrationManagement.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// "super_admin" -> "Super Admin"
const formatRole = (role) =>
  String(role || 'Not assigned')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function SuperAdminAdministrators() {
  const [searchTerm, setSearchTerm] = useState('');
  const [adminData, setAdminData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadAdmins = async () => {
      try {
        const response = await fetch(`${API_URL}/super-admin/admins`, {
          credentials: 'include',
          signal: controller.signal,
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error || payload?.message || 'Failed to load administrators');
        }

        const items = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

        setAdminData(
          items.map((item) => ({
            id: item.id,
            name: item.name || item.full_name || 'Unnamed administrator',
            role: formatRole(item.role),
            status: item.status || (item.is_active === false ? 'Inactive' : 'Active'),
          }))
        );
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadAdmins();

    return () => controller.abort();
  }, []);

  const filteredAdmins = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return adminData.filter((item) =>
      !query || `${item.name} ${item.role}`.toLowerCase().includes(query)
    );
  }, [adminData, searchTerm]);

  const activeCount = adminData.filter((item) => item.status === 'Active').length;

  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Super admin</p>
          <h1 className="administration-title">Administrators</h1>
        </div>

        <div className="fellowship-member-search">
          <SearchBar
            placeholder="Search administrators"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </header>

      <section className="administration-stats" aria-label="Administrators overview">
        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Total admins</p>
          <p className="administration-card-value">{adminData.length}</p>
          <p className="administration-card-detail">Registered administrators</p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Active</p>
          <p className="administration-card-value">{activeCount}</p>
          <p className="administration-card-detail">Currently active</p>
        </article>

        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Roles</p>
          <p className="administration-card-value">{new Set(adminData.map((item) => item.role)).size}</p>
          <p className="administration-card-detail">Assigned roles</p>
        </article>
      </section>

      <section className="fellowship-member-panel" aria-label="Administrator list">
        <div className="fellowship-member-panel-header">
          <h2>Administrator directory</h2>
          <span>{loading ? 'Loading...' : `${filteredAdmins.length} total`}</span>
        </div>

        <div className="admin-grid-list">
          {loading ? (
            <div style={{ gridColumn: '1 / -1', color: '#64748b', padding: '8px 0' }}>
              Loading administrators...
            </div>
          ) : error ? (
            <div role="alert" style={{ gridColumn: '1 / -1', color: '#b91c1c', padding: '8px 0' }}>
              {error}
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', color: '#64748b', padding: '8px 0' }}>
              {adminData.length === 0
                ? 'No administrators have been added yet.'
                : 'No administrator matches your search.'}
            </div>
          ) : (
            filteredAdmins.map((item) => (
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
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Role: {item.role}</p>
                <div className="admin-grid-item-body">
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Status</span>
                  <strong style={{ color: '#111827', fontSize: '1.1rem' }}>{item.status}</strong>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}