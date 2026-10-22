
import { useEffect, useMemo, useState } from 'react';
import SearchBar from '../../component/searchBar.jsx';
import '../../styles/administrationManagement.css';
import '../../styles/ui.css';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

const roleOptions = [
  { role: 'member', label: 'Members' },
  { role: 'cell_leader', label: 'Cell Leaders' },
  { role: 'fellowship_leader', label: 'Fellowship Leaders' },
  { role: 'assistant_leader', label: 'Assistant Leaders' },
  { role: 'women_leader', label: 'Women Leaders' },
];

const roleLabels = {
  super_admin: 'Super Administrator',
  admin: 'Administrator',
  group_leader: 'Group Leader',
  fellowship_leader: 'Fellowship Leader',
  cell_leader: 'Cell Leader',
  assistant_leader: 'Assistant Leader',
  member: 'Member',
  women_leader: 'Women Leader',
};

export default function FellowshipLeadersPage() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [members, setMembers] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState('');

  // Member detail modal state
  const [detailMember, setDetailMember] = useState(null);
  const [editableRole, setEditableRole] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestError, setRequestError] = useState('');

  // Fetch fellowship groups.
  useEffect(() => {
    const controller = new AbortController();

    const fetchGroups = async () => {
      try {
        setLoadingGroups(true);
        setError('');

        const response = await fetch(`${API_BASE}/api/groups`, {
          credentials: 'include',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch groups');
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Invalid groups response');
        }

        const fellowships = data.filter(
          (group) =>
            String(group.type).toLowerCase() === 'fellowship'
        );

        setGroups(fellowships);

        if (fellowships.length > 0) {
          setSelectedGroup(String(fellowships[0].id));
        } else {
          setSelectedGroup('');
          setMembers([]);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Fetch fellowships error:', err);
          setError('Unable to load fellowships.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingGroups(false);
        }
      }
    };

    fetchGroups();

    return () => controller.abort();
  }, []);

  // Fetch members of the selected fellowship.
  useEffect(() => {
    if (!selectedGroup) {
      setMembers([]);
      setLoadingMembers(false);
      return;
    }

    const controller = new AbortController();

    const fetchMembers = async () => {
      try {
        setLoadingMembers(true);
        setError('');
        setMembers([]);

        const response = await fetch(
          `${API_BASE}/api/user-groups/group/${selectedGroup}/members`,
          {
            method: 'GET',
            credentials: 'include',
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch fellowship members (${response.status})`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Invalid fellowship members response');
        }

        setMembers(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Fetch members error:', err);
          setMembers([]);
          setError('Unable to load members for this fellowship.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMembers(false);
        }
      }
    };

    fetchMembers();

    return () => controller.abort();
  }, [selectedGroup]);

  // Count users according to their database role.
  const roleCounts = useMemo(() => {
    const counts = {};

    roleOptions.forEach(({ role }) => {
      counts[role] = members.filter(
        (member) => member.role === role
      ).length;
    });

    return counts;
  }, [members]);

  const selectedGroupName =
    groups.find(
      (group) => String(group.id) === selectedGroup
    )?.name || '';

  // Display users belonging to the selected role.
  const filteredMembers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return members.filter((member) => {
      const matchesRole = member.role === selectedRole;

      const name = member.full_name || '';
      const email = member.email || '';
      const role = roleLabels[member.role] || member.role || '';

      const matchesSearch =
        `${name} ${email} ${role}`.toLowerCase().includes(search);

      return matchesRole && matchesSearch;
    });
  }, [members, selectedRole, searchTerm]);

  const handleGroupChange = (event) => {
    setSelectedGroup(event.target.value);
    setSelectedRole('');
    setSearchTerm('');
    setError('');
  };

  const handleRoleClick = (role) => {
    setSelectedRole(role);
    setSearchTerm('');
  };

  // Open the member detail modal.
  const handleMemberClick = (member) => {
    setDetailMember(member);
    setEditableRole(
      roleLabels[member.role] || member.role || ''
    );
    setRequestMessage('');
    setRequestError('');
  };

  const closeDetailModal = () => {
    if (requestLoading) return;

    setDetailMember(null);
    setEditableRole('');
    setRequestMessage('');
    setRequestError('');
  };

  // Submit a leadership assignment request.
  const handleSendRequest = async () => {
    if (!detailMember) return;

    setRequestError('');
    setRequestMessage('');

    const requestedRole = editableRole.trim();

    const targetUserId =
      detailMember.id ??
      detailMember.user_id ??
      detailMember._id;

    if (!selectedGroup) {
      setRequestError('Please select a fellowship.');
      return;
    }

    if (!targetUserId || !Number.isSafeInteger(Number(targetUserId))) {
      setRequestError('Unable to identify the selected user.');
      return;
    }

    if (!requestedRole) {
      setRequestError('Please enter a role.');
      return;
    }

    try {
      setRequestLoading(true);

      const payload = {
        // All requests submitted by this form use this request type.
        request_type: 'leader_assignment',

        group_id: Number(selectedGroup),

        request_data: {
          // Existing user receiving the requested role.
          target_user_id: Number(targetUserId),

          // The role entered in the form.
          requested_role: requestedRole.toLowerCase(),
        },
      };

      const response = await fetch(`${API_BASE}/api/requests`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error || 'Failed to send the request.'
        );
      }

      setRequestMessage(
        'Request submitted for administrator approval.'
      );
    } catch (err) {
      console.error('Submit leadership request error:', err);
      setRequestError(err.message || 'Something went wrong.');
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="administration-section-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Fellowship</p>
          <h1>Leadership and Members</h1>
          <p>View fellowship membership by role.</p>
        </div>

        <div style={styles.groupSelector}>
          <label htmlFor="fellowship-select" style={styles.labelText}>
            Select Fellowship
          </label>

          <select
            id="fellowship-select"
            value={selectedGroup}
            onChange={handleGroupChange}
            style={styles.selectInput}
            disabled={loadingGroups || groups.length === 0}
          >
            <option value="">Select a fellowship</option>

            {groups.map((group) => (
              <option key={group.id} value={String(group.id)}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {loadingGroups && (
        <p style={styles.message}>Loading fellowships...</p>
      )}

      {!loadingGroups && groups.length === 0 && !error && (
        <p style={styles.message}>No fellowships found.</p>
      )}

      {error && (
        <p role="alert" style={styles.error}>
          {error}
        </p>
      )}

      {selectedGroup && (
        <>
          <section
            className="administration-stats"
            aria-label="Fellowship role totals"
          >
            <article className="administration-card fellowship-summary-card">
              <p className="administration-card-label">
                {selectedGroupName}
              </p>

              <p className="administration-card-value">
                {loadingMembers ? '—' : members.length}
              </p>

              <p className="administration-card-detail">
                Total users in this fellowship
              </p>
            </article>
          </section>

          <section style={styles.roleSection}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Membership by Role</h2>
                <p style={styles.sectionDescription}>
                  Select a role to view its users.
                </p>
              </div>
            </div>

            <div style={styles.roleGrid}>
              {roleOptions.map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleRoleClick(item.role)}
                  style={{
                    ...styles.roleCard,
                    ...(selectedRole === item.role
                      ? styles.activeRoleCard
                      : {}),
                  }}
                  aria-pressed={selectedRole === item.role}
                  disabled={loadingMembers}
                >
                  <span style={styles.roleCardLabel}>
                    {item.label}
                  </span>

                  <span style={styles.roleCardCount}>
                    {loadingMembers ? '—' : roleCounts[item.role]}
                  </span>

                  <span style={styles.roleCardFooter}>
                    View {item.label.toLowerCase()}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {selectedRole && (
            <section
              className="fellowship-member-panel"
              aria-label="Users by selected role"
            >
              <div className="fellowship-member-panel-header">
                <div>
                  <h2>
                    {roleOptions.find(
                      (item) => item.role === selectedRole
                    )?.label}
                  </h2>

                  <p style={styles.panelDescription}>
                    {selectedGroupName}
                  </p>
                </div>

                <span>
                  {loadingMembers
                    ? 'Loading...'
                    : `${filteredMembers.length} shown`}
                </span>
              </div>

              <div style={styles.listSearch}>
                <SearchBar
                  placeholder="Search by name or email"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                />
              </div>

              {loadingMembers && (
                <p style={styles.message}>Loading users...</p>
              )}

              {!loadingMembers &&
                !error &&
                filteredMembers.length === 0 && (
                  <p style={styles.message}>
                    {members.filter(
                      (member) => member.role === selectedRole
                    ).length === 0
                      ? 'No users have this role in the selected fellowship.'
                      : 'No users match your search.'}
                  </p>
                )}

              {!loadingMembers && filteredMembers.length > 0 && (
                <div className="fellowship-member-list">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id ?? member.user_id ?? member._id}
                      className="fellowship-member-row"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleMemberClick(member)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleMemberClick(member);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="fellowship-member-meta">
                        <div className="fellowship-member-avatar">
                          {(member.full_name || '?')
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="fellowship-member-name">
                            {member.full_name}
                          </p>

                          <span className="fellowship-member-role">
                            {roleLabels[member.role] || member.role}
                          </span>
                        </div>
                      </div>

                      <div style={styles.memberEmail}>
                        {member.email || 'No email available'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {detailMember && (
        <div
          style={styles.backdrop}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDetailModal();
          }}
        >
          <section
            style={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-detail-title"
          >
            <div style={styles.modalHeader}>
              <div>
                <p style={styles.eyebrow}>Member details</p>

                <h2
                  id="member-detail-title"
                  style={styles.modalTitle}
                >
                  {detailMember.full_name || 'Unnamed member'}
                </h2>

                <p style={styles.description}>
                  Review member information and request a role change.
                  An administrator must approve the request.
                </p>
              </div>

              <button
                type="button"
                style={styles.closeButton}
                onClick={closeDetailModal}
                disabled={requestLoading}
                aria-label="Close details"
              >
                ×
              </button>
            </div>

            {requestError && (
              <div style={styles.error} role="alert">
                {requestError}
              </div>
            )}

            {requestMessage && (
              <div style={styles.success} role="status">
                {requestMessage}
              </div>
            )}

            <div style={styles.detailGrid}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Full name</span>
                <span style={styles.detailValue}>
                  {detailMember.full_name || '—'}
                </span>
              </div>

              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Email</span>
                <span style={styles.detailValue}>
                  {detailMember.email || '—'}
                </span>
              </div>

              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Phone</span>
                <span style={styles.detailValue}>
                  {detailMember.phone_number || '—'}
                </span>
              </div>

              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Fellowship</span>
                <span style={styles.detailValue}>
                  {selectedGroupName || '—'}
                </span>
              </div>
            </div>

            <div style={styles.field}>
              <label htmlFor="member-role" style={styles.label}>
                Requested role
              </label>

              <input
                id="member-role"
                type="text"
                value={editableRole}
                onChange={(e) => setEditableRole(e.target.value)}
                placeholder="Enter a role, e.g. cell_leader"
                style={styles.textInput}
                disabled={requestLoading || Boolean(requestMessage)}
              />
            </div>

            <div style={styles.actions}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={closeDetailModal}
                disabled={requestLoading}
              >
                Close
              </button>

              <button
                type="button"
                style={{
                  ...styles.submitButton,
                  opacity:
                    requestLoading || requestMessage ? 0.65 : 1,
                }}
                onClick={handleSendRequest}
                disabled={requestLoading || Boolean(requestMessage)}
              >
                {requestLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

const styles = {
  groupSelector: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '240px',
  },
  labelText: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
  },
  selectInput: {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '14px',
    color: '#111827',
    background: '#ffffff',
    outline: 'none',
  },
  textInput: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '14px',
    color: '#111827',
    background: '#ffffff',
    outline: 'none',
  },
  roleSection: {
    margin: '24px 0',
  },
  sectionHeader: {
    marginBottom: '16px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '20px',
    color: '#111827',
  },
  sectionDescription: {
    margin: '6px 0 0',
    color: '#6b7280',
    fontSize: '14px',
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: '16px',
  },
  roleCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '12px',
    width: '100%',
    padding: '20px',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '14px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
  },
  activeRoleCard: {
    border: '2px solid #6366f1',
    background: '#eef2ff',
  },
  roleCardLabel: {
    color: '#4b5563',
    fontSize: '14px',
    fontWeight: 600,
  },
  roleCardCount: {
    color: '#111827',
    fontSize: '30px',
    fontWeight: 700,
  },
  roleCardFooter: {
    color: '#6366f1',
    fontSize: '12px',
    fontWeight: 600,
  },
  panelDescription: {
    margin: '5px 0 0',
    color: '#6b7280',
    fontSize: '13px',
  },
  listSearch: {
    margin: '16px 0',
    maxWidth: '380px',
  },
  memberEmail: {
    color: '#6b7280',
    fontSize: '13px',
    overflowWrap: 'anywhere',
  },
  message: {
    color: '#6b7280',
    padding: '16px 0',
  },
  error: {
    color: '#b91c1c',
    padding: '12px 0',
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'rgba(15, 23, 42, 0.55)',
    overflowY: 'auto',
  },
  modal: {
    width: '100%',
    maxWidth: '520px',
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
    padding: '26px',
    borderRadius: '16px',
    background: '#fff',
    color: '#111827',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
    boxSizing: 'border-box',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '20px',
  },
  eyebrow: {
    margin: '0 0 6px',
    color: '#6b7280',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  modalTitle: {
    margin: '4px 0 8px',
    fontSize: '22px',
  },
  description: {
    margin: 0,
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  closeButton: {
    border: 'none',
    background: 'transparent',
    color: '#6b7280',
    fontSize: '28px',
    cursor: 'pointer',
  },
  detailGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    fontSize: '14px',
  },
  detailLabel: {
    color: '#6b7280',
    fontWeight: 600,
  },
  detailValue: {
    color: '#111827',
    textAlign: 'right',
    overflowWrap: 'anywhere',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    marginBottom: '18px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '20px',
  },
  cancelButton: {
    padding: '11px 17px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    background: '#fff',
    color: '#374151',
    font: 'inherit',
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitButton: {
    padding: '11px 17px',
    border: '1px solid #374151',
    borderRadius: '8px',
    background: '#374151',
    color: '#fff',
    font: 'inherit',
    fontWeight: 600,
    cursor: 'pointer',
  },
  success: {
    marginBottom: '16px',
    padding: '12px 14px',
    borderRadius: '8px',
    background: '#ecfdf5',
    color: '#065f46',
    fontSize: '14px',
  },
};
