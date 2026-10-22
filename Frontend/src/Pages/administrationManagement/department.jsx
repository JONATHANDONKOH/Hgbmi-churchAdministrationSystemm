import { useMemo, useState } from 'react';
import SearchBar from '../../component/searchBar';
import '../../styles/administrationManagement.css';

const departmentData = [
  { name: 'Administration', leader: 'Kwame Boateng', members: 12, status: 'Active' },
  { name: 'Finance', leader: 'Mabel Essien', members: 8, status: 'Active' },
  { name: 'Media', leader: 'Peter Yeboah', members: 10, status: 'Active' },
  { name: 'Welfare', leader: 'Rita Owusu', members: 9, status: 'Active' },
  { name: 'Outreach', leader: ' Daniel Narh', members: 11, status: 'Active' },
  { name: 'Prayer', leader: 'Naomi Agyeman', members: 7, status: 'Active' },
];

export default function AdministrationDepartment() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDepartments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return departmentData.filter((item) =>
      !query || `${item.name} ${item.leader}`.toLowerCase().includes(query)
    );
  }, [searchTerm]);

  const totalMembers = departmentData.reduce((sum, item) => sum + item.members, 0);
  const activeCount = departmentData.filter((item) => item.status === 'Active').length;

  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Administration</p>
          <h1 className="administration-title">Department</h1>
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
          <p className="administration-card-value">{activeCount}</p>
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
          <span>{filteredDepartments.length} total</span>
        </div>

        <div className="admin-grid-list">
          {filteredDepartments.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', color: '#64748b', padding: '8px 0' }}>
              No department matches your search.
            </div>
          ) : (
            filteredDepartments.map((item) => (
              <article key={item.name} className="admin-grid-item">
                <div className="admin-grid-item-top">
                  <div className="fellowship-member-avatar" style={{ width: '42px', height: '42px' }}>
                    {item.name.charAt(0)}
                  </div>
                  <span className="fellowship-member-status status-present" style={{ minWidth: '88px' }}>
                    Active
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
