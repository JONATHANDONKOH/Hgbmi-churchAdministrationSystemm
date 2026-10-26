import { useCallback, useEffect, useState } from 'react';
import SearchBar from '../../component/searchBar';
import { Create } from '../../component/button';
import '../../styles/administrationManagement.css';
import '../../styles/ui.css';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

const initialFormData = {
  full_name: '',
  email: '',
  phone: '',
  password: '',
};

export default function CellMembersPage({ groupId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const fetchMembers = useCallback(async (signal) => {
    if (!groupId) {
      setMembers([]);
      setError('No cell group ID was provided.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_URL}/api/user-groups/group/${groupId}/members`,
        {
          method: 'GET',
          credentials: 'include',
          signal,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch members. HTTP ${response.status}`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('The API response is not an array.');
      }

      setMembers(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Fetch cell members error:', err);
        setError(err.message || 'Unable to load cell members.');
        setMembers([]);
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [groupId]);

  useEffect(() => {
    const controller = new AbortController();

    fetchMembers(controller.signal);

    return () => controller.abort();
  }, [fetchMembers]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleOpenForm = () => {
    setError('');
    setSuccess('');
    setFormData(initialFormData);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    if (submitting) return;

    setShowForm(false);
    setFormData(initialFormData);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!groupId) {
      setError(
        'Cannot create a member request because the cell group ID is missing.'
      );
      return;
    }

    try {
      setSubmitting(true);

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            'Failed to submit member request.'
        );
      }

      setSuccess(
        data.message ||
          'Member request submitted successfully for administrator approval.'
      );

      setFormData(initialFormData);
      setShowForm(false);
    } catch (err) {
      console.error('Create cell member request error:', err);

      setError(
        err.message || 'Unable to submit member request.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMembers = members.filter((member) => {
    const search = searchTerm.trim().toLowerCase();

    const name = member.full_name || member.name || '';
    const email = member.email || '';
    const role = member.role || '';

    return `${name} ${email} ${role}`
      .toLowerCase()
      .includes(search);
  });

  return (
    <div className="administration-management">
      {/* Page heading and top-right Create Member button */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          width: '100%',
          gap: '16px',
        }}
      >
        <div>
          <h1>Cell Members</h1>
          <p>View and manage members belonging to this cell.</p>
        </div>

        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <Create
            label="Create Member"
            onClick={handleOpenForm}
          />
        </div>
      </div>

      {/* Success message */}
      {success && (
        <p
          role="status"
          style={{
            color: 'green',
            marginBottom: '16px',
          }}
        >
          {success}
        </p>
      )}

      {/* Error message */}
      {error && !showForm && (
        <p
          role="alert"
          style={{
            color: 'red',
            marginBottom: '16px',
          }}
        >
          {error}
        </p>
      )}

      {/* Search and member count */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        <SearchBar
          placeholder="Search members"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <p>
          <strong>Total Members:</strong> {members.length}
        </p>
      </div>

      {/* Loading message */}
      {loading && <p>Loading cell members...</p>}

      {/* Empty state */}
      {!loading && !error && filteredMembers.length === 0 && (
        <p>
          {searchTerm
            ? 'No members match your search.'
            : 'No members found for this cell.'}
        </p>
      )}

      {/* Members table */}
      {!loading && filteredMembers.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px' }}>
                  Full Name
                </th>

                <th style={{ textAlign: 'left', padding: '12px' }}>
                  Email
                </th>

                <th style={{ textAlign: 'left', padding: '12px' }}>
                  Phone
                </th>

                <th style={{ textAlign: 'left', padding: '12px' }}>
                  Role
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredMembers.map((member, index) => (
                <tr
                  key={member.id || member.user_id || index}
                  style={{ borderTop: '1px solid #ddd' }}
                >
                  <td style={{ padding: '12px' }}>
                    {member.full_name || member.name || 'N/A'}
                  </td>

                  <td style={{ padding: '12px' }}>
                    {member.email || 'N/A'}
                  </td>

                  <td style={{ padding: '12px' }}>
                    {member.phone_number || member.phone || 'N/A'}
                  </td>

                  <td style={{ padding: '12px' }}>
                    {member.role || 'Member'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Member form modal */}
      {showForm && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseForm();
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            zIndex: 1000,
            overflowY: 'auto',
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-member-title"
            style={{
              background: '#fff',
              width: '100%',
              maxWidth: '500px',
              padding: '24px',
              borderRadius: '10px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxSizing: 'border-box',
            }}
          >
            {/* Form heading */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div>
                <p style={{ margin: '0 0 8px', color: '#666' }}>
                  Cell
                </p>

                <h2
                  id="create-member-title"
                  style={{ margin: '0 0 8px' }}
                >
                  Create Member Request
                </h2>

                <p style={{ margin: 0, color: '#666' }}>
                  Enter the prospective member's details for
                  administrator approval.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseForm}
                disabled={submitting}
                aria-label="Close form"
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '26px',
                  cursor: 'pointer',
                }}
              >
                &times;
              </button>
            </div>

            {/* Form error */}
            {error && (
              <p
                role="alert"
                style={{
                  color: 'red',
                  marginBottom: '16px',
                }}
              >
                {error}
              </p>
            )}

            {/* Member details form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="full_name"
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Full Name
                </label>

                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                  autoComplete="name"
                  style={{
                    width: '100%',
                    padding: '11px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="email"
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Email Address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  required
                  autoComplete="email"
                  style={{
                    width: '100%',
                    padding: '11px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="phone"
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Phone Number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  autoComplete="tel"
                  style={{
                    width: '100%',
                    padding: '11px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor="password"
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Initial Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter initial password"
                  minLength={8}
                  maxLength={72}
                  required
                  autoComplete="new-password"
                  style={{
                    width: '100%',
                    padding: '11px',
                    boxSizing: 'border-box',
                  }}
                />

                <small style={{ color: '#666' }}>
                  Password must be at least 8 characters long.
                </small>
              </div>

              {/* Form actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={submitting}
                  style={{
                    padding: '10px 18px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 18px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}