import { useCallback, useEffect, useState } from 'react';
import SearchBar from '../../component/searchBar';
import { Create } from '../../component/button';
import '../../styles/administrationManagement.css';
import '../../styles/ui.css';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

export default function CellMembersPage({ groupId }) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
  });

  const validGroupId =
    groupId !== undefined &&
    groupId !== null &&
    String(groupId).trim() !== '' &&
    Number.isSafeInteger(Number(groupId)) &&
    Number(groupId) > 0;

  const styles = {
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
      marginBottom: '24px',
    },
    eyebrow: {
      margin: '0 0 6px',
      color: '#6b7280',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
    title: {
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
    input: {
      width: '100%',
      boxSizing: 'border-box',
      padding: '12px 13px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      background: '#fff',
      color: '#111827',
      font: 'inherit',
      outline: 'none',
    },
    hint: {
      color: '#6b7280',
      fontSize: '12px',
      lineHeight: 1.5,
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: '10px',
      marginTop: '24px',
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
    error: {
      marginBottom: '16px',
      padding: '12px 14px',
      borderRadius: '8px',
      background: '#fef2f2',
      color: '#b91c1c',
      fontSize: '14px',
    },
    success: {
      marginBottom: '16px',
      padding: '12px 14px',
      borderRadius: '8px',
      background: '#ecfdf5',
      color: '#065f46',
      fontSize: '14px',
    },
    empty: {
      padding: '24px',
      color: '#6b7280',
      textAlign: 'center',
    },
    loadingText: {
      padding: '24px',
      color: '#6b7280',
      textAlign: 'center',
    },
  };

  const fetchMembers = useCallback(
    async (signal) => {
      if (!validGroupId) {
        setMembers([]);
        setLoadingMembers(false);
        return;
      }

      try {
        setLoadingMembers(true);
        setMembersError('');

        const response = await fetch(
          `${API_URL}/api/user-groups/group/${Number(groupId)}/members`,
          {
            method: 'GET',
            credentials: 'include',
            signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch cell members (${response.status})`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Invalid cell members response');
        }

        setMembers(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Fetch cell members error:', err);
          setMembers([]);
          setMembersError('Unable to load members for this cell.');
        }
      } finally {
        if (!signal?.aborted) {
          setLoadingMembers(false);
        }
      }
    },
    [groupId, validGroupId]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchMembers(controller.signal);

    return () => controller.abort();
  }, [fetchMembers]);

  const filteredMembers = members.filter((member) => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return true;

    const name = member.full_name || member.name || '';
    const email = member.email || '';
    const role = member.role || '';

    return `${name} ${email} ${role}`.toLowerCase().includes(search);
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const closeForm = () => {
    if (loading) return;

    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validGroupId) {
      setError('The cell group ID is missing or invalid.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/requests`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_type: 'user',
          group_id: Number(groupId),
          request_data: {
            full_name: formData.full_name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || null,
            password: formData.password,
          },
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            'Failed to submit cell membership request.'
        );
      }

      setSuccess(
        'Cell membership request submitted for administrator approval.'
      );

      setFormData({
        full_name: '',
        email: '',
        phone: '',
        password: '',
      });

      setShowForm(false);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="administration-section-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Cell</p>
          <h1>Members</h1>
        </div>

        <div className="dashboard-actions">
          <SearchBar
            placeholder="Search cell members"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button
            type="button"
            className="my-button"
            style={{ background: '#374151' }}
          >
            Export
          </button>

          <Create
            label="Create Member"
            onClick={() => {
              setError('');
              setSuccess('');
              setShowForm(true);
            }}
          />
        </div>
      </header>

      {success && (
        <div style={styles.success} role="status">
          {success}
        </div>
      )}

      {error && !showForm && (
        <div style={styles.error} role="alert">
          {error}
        </div>
      )}

      {membersError && (
        <div style={styles.error} role="alert">
          {membersError}
        </div>
      )}

      <section
        className="administration-stats"
        aria-label="Cell members summary"
      >
        <article className="administration-card fellowship-summary-card">
          <p className="administration-card-label">Total members</p>
          <p className="administration-card-value">
            {loadingMembers ? '—' : members.length}
          </p>
          <p className="administration-card-detail">
            Approved members in the cell
          </p>
        </article>
      </section>

      <section
        className="fellowship-member-panel"
        aria-label="Cell members list"
      >
        <div className="fellowship-member-panel-header">
          <h2>Cell member list</h2>
          <span>
            {loadingMembers
              ? 'Loading...'
              : `${filteredMembers.length} shown`}
          </span>
        </div>

        <div className="fellowship-member-list">
          {loadingMembers ? (
            <p style={styles.loadingText}>Loading cell members...</p>
          ) : membersError ? (
            <p style={styles.empty}>Unable to display cell members.</p>
          ) : filteredMembers.length === 0 ? (
            <p style={styles.empty}>
              {members.length === 0
                ? 'No members to display.'
                : 'No members match your search.'}
            </p>
          ) : (
            filteredMembers.map((member) => {
              const name = member.full_name || member.name || 'Unknown';
              const role = member.role || '—';
              const cell = member.cell || member.team || '—';
              const status = member.status || 'Active';

              return (
                <div
                  key={member.id || member._id}
                  className="fellowship-member-row"
                >
                  <div className="fellowship-member-meta">
                    <div className="fellowship-member-avatar">
                      {name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <p className="fellowship-member-name">{name}</p>
                      <span className="fellowship-member-role">
                        {role}
                      </span>
                    </div>
                  </div>

                  <div className="fellowship-member-cell">{cell}</div>

                  <span
                    className={`fellowship-member-status ${
                      status === 'Present' || status === 'Active'
                        ? 'status-present'
                        : 'status-absent'
                    }`}
                  >
                    {status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      {showForm && (
        <div
          style={styles.backdrop}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <section
            style={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-cell-member-title"
          >
            <div style={styles.modalHeader}>
              <div>
                <p style={styles.eyebrow}>Cell</p>
                <h2
                  id="create-cell-member-title"
                  style={styles.title}
                >
                  Create Member Request
                </h2>
                <p style={styles.description}>
                  Enter the prospective cell member&apos;s details for
                  administrator approval.
                </p>
              </div>

              <button
                type="button"
                style={styles.closeButton}
                onClick={closeForm}
                disabled={loading}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            {error && (
              <div style={styles.error} role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={styles.field}>
                <label htmlFor="full_name" style={styles.label}>
                  Full name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="Enter full name"
                  value={formData.full_name}
                  onChange={handleChange}
                  style={styles.input}
                  required
                  autoComplete="name"
                />
              </div>

              <div style={styles.field}>
                <label htmlFor="email" style={styles.label}>
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleChange}
                  style={styles.input}
                  required
                  autoComplete="email"
                />
              </div>

              <div style={styles.field}>
                <label htmlFor="phone" style={styles.label}>
                  Phone number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  style={styles.input}
                  autoComplete="tel"
                />
              </div>

              <div style={styles.field}>
                <label htmlFor="password" style={styles.label}>
                  Initial password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  style={styles.input}
                  minLength={8}
                  maxLength={72}
                  required
                  autoComplete="new-password"
                />
                <small style={styles.hint}>
                  This password will be used when the membership request
                  is approved.
                </small>
              </div>

              <div style={styles.actions}>
                <button
                  type="button"
                  style={{
                    ...styles.cancelButton,
                    opacity: loading ? 0.65 : 1,
                  }}
                  onClick={closeForm}
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    ...styles.submitButton,
                    opacity: loading ? 0.65 : 1,
                  }}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}