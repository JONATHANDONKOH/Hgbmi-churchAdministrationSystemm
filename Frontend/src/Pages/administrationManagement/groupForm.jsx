
import { useEffect, useMemo, useState } from 'react';
import '../../styles/administrationManagement.css';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

const groupTypes = [
  'fellowship',
  'cell',
  'department',
  'ministry',
];

const leaderRoles = [
  'group_leader',
  'assistant_leader',
  'fellowship_leader',
  'cell_leader',
  'department_leader',
  'ministry_leader',
  'women_leader',
];

function getPermissions(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.permissions)) return data.permissions;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.userPermissions)) return data.userPermissions;
  return [];
}

function getPermissionId(permission) {
  return permission.id ?? permission.permission_id;
}

function getPermissionName(permission) {
  if (typeof permission === 'string') return permission;

  return (
    permission.name ||
    permission.permission_name ||
    permission.label ||
    `Permission ${permission.id ?? ''}`
  );
}

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed with status ${response.status}.`
    );
  }

  return data;
}

export default function CreateGroupLeader({ onCancel, onSubmit }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'group_leader',
    groupName: '',
    groupType: '',
    location: '',
    description: '',
  });

  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionsError, setPermissionsError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch permissions assigned to the logged-in administrator.
  useEffect(() => {
    let cancelled = false;

    async function fetchPermissions() {
      try {
        setPermissionsLoading(true);
        setPermissionsError('');

        const response = await fetch(
          `${API_BASE}/api/permissions/mine`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          }
        );

        const data = await readResponse(response);

        if (!cancelled) {
          const availablePermissions = getPermissions(data);

          // Permission assignment requires actual database IDs.
          const validPermissions = availablePermissions.filter(
            (permission) =>
              getPermissionId(permission) !== undefined &&
              getPermissionId(permission) !== null
          );

          setPermissions(validPermissions);
        }
      } catch (err) {
        if (!cancelled) {
          setPermissionsError(
            err.message || 'Unable to load your permissions.'
          );
        }
      } finally {
        if (!cancelled) {
          setPermissionsLoading(false);
        }
      }
    }

    fetchPermissions();

    return () => {
      cancelled = true;
    };
  }, []);

  // Group the administrator's permissions by database category.
  const permissionCategories = useMemo(() => {
    const grouped = new Map();

    permissions.forEach((permission) => {
      const categoryId = permission.category_id ?? 'other';

      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, {
          id: categoryId,
          name: permission.category_name || 'Other Permissions',
          permissions: [],
        });
      }

      grouped.get(categoryId).permissions.push(permission);
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [permissions]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function togglePermission(permissionId) {
    setSelectedPermissions((previous) =>
      previous.includes(permissionId)
        ? previous.filter((id) => id !== permissionId)
        : [...previous, permissionId]
    );
  }

  function toggleCategory(categoryPermissions) {
    const categoryIds = categoryPermissions.map(getPermissionId);

    const allSelected = categoryIds.every((id) =>
      selectedPermissions.includes(id)
    );

    setSelectedPermissions((previous) => {
      if (allSelected) {
        return previous.filter((id) => !categoryIds.includes(id));
      }

      return [...new Set([...previous, ...categoryIds])];
    });
  }

  function isCategorySelected(categoryPermissions) {
    return (
      categoryPermissions.length > 0 &&
      categoryPermissions.every((permission) =>
        selectedPermissions.includes(getPermissionId(permission))
      )
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (permissionsLoading) {
      setError('Please wait while your permissions are loading.');
      return;
    }

    if (permissionsError) {
      setError('Your permissions could not be loaded. Please try again.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (!form.groupType) {
      setError('Please select a group type.');
      return;
    }

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.groupName.trim()
    ) {
      setError('Please complete all required fields.');
      return;
    }

    if (!permissions.some(
      (permission) => permission.name === 'assign_permissions'
    )) {
      setError(
        'You do not have permission to assign permissions. Contact your super administrator.'
      );
      return;
    }

    const groupPayload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      role: form.role,

      groupName: form.groupName.trim(),
      type: form.groupType,
      location: form.location.trim(),
      description: form.description.trim(),
    };

    try {
      setSubmitting(true);

      // STEP 1: Create the group and its leader.
      const createResponse = await fetch(
        `${API_BASE}/api/groups/with-leader`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(groupPayload),
        }
      );

      const createdData = await readResponse(createResponse);

      const createdUser =
        createdData.user ||
        createdData.data?.user;

      if (!createdUser?.id) {
        throw new Error(
          'The group creation response did not contain the new user ID. Check your createWithLeader controller response.'
        );
      }

      // STEP 2: Assign selected permissions to the newly created user.
      if (selectedPermissions.length > 0) {
        const assignResponse = await fetch(
          `${API_BASE}/api/permissions/assign`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              userId: createdUser.id,
              permissionIds: selectedPermissions,
            }),
          }
        );

        await readResponse(assignResponse);
      }

      setSuccess(
        selectedPermissions.length > 0
          ? 'Group, leader and permissions created successfully.'
          : 'Group and leader created successfully. No additional permissions were selected.'
      );

      // Notify the parent component after successful API requests.
      if (onSubmit) {
        await onSubmit({
          user: createdUser,
          group: createdData.group || createdData.data?.group,
          permissions: selectedPermissions,
        });
      }
    } catch (err) {
      setError(
        err.message ||
          'Something went wrong while creating the group and leader.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '11px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '7px',
    fontSize: '14px',
    boxSizing: 'border-box',
    background: '#fff',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '7px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
  };

  const fieldStyle = {
    marginBottom: '17px',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: '#fff',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '12px',
          padding: '28px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div>
            <p style={{ color: '#64748b', margin: '0 0 6px' }}>
              Administration
            </p>

            <h2 style={{ margin: 0, color: '#0f172a' }}>
              Create Group & Leader
            </h2>

            <p style={{ color: '#64748b', fontSize: '14px' }}>
              Create a group, register its leader and assign permissions.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            style={{
              border: 'none',
              background: '#f1f5f9',
              borderRadius: '7px',
              padding: '9px 13px',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* LEADER INFORMATION */}
          <h3>1. Leader information</h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
            }}
          >
            <div style={fieldStyle}>
              <label style={labelStyle}>Full name *</label>

              <input
                style={inputStyle}
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Email address *</label>

              <input
                style={inputStyle}
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email address"
                required
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Phone number</label>

              <input
                style={inputStyle}
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Leader role *</label>

              <select
                style={inputStyle}
                name="role"
                value={form.role}
                onChange={handleChange}
                required
              >
                {leaderRoles.map((role) => (
                  <option key={role} value={role}>
                    {role.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Password *</label>

              <input
                style={inputStyle}
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create password"
                minLength={8}
                required
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Confirm password *</label>

              <input
                style={inputStyle}
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                minLength={8}
                required
              />
            </div>
          </div>

          <hr
            style={{
              border: 0,
              borderTop: '1px solid #e2e8f0',
              margin: '22px 0',
            }}
          />

          {/* GROUP INFORMATION */}
          <h3>2. Group information</h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
            }}
          >
            <div style={fieldStyle}>
              <label style={labelStyle}>Group name *</label>

              <input
                style={inputStyle}
                name="groupName"
                value={form.groupName}
                onChange={handleChange}
                placeholder="Enter group name"
                required
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Group type *</label>

              <select
                style={inputStyle}
                name="groupType"
                value={form.groupType}
                onChange={handleChange}
                required
              >
                <option value="">Select group type</option>

                {groupTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Location</label>

              <input
                style={inputStyle}
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Enter group location"
              />
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Group description</label>

            <textarea
              style={{
                ...inputStyle,
                minHeight: '90px',
                resize: 'vertical',
              }}
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the group"
            />
          </div>

          <hr
            style={{
              border: 0,
              borderTop: '1px solid #e2e8f0',
              margin: '22px 0',
            }}
          />

          {/* PERMISSIONS */}
          <h3>3. Assign permissions</h3>

          <p style={{ fontSize: '13px', color: '#64748b' }}>
            These are the permissions assigned to your administrator
            account. You can delegate the permissions you have been
            granted.
          </p>

          {permissionsLoading ? (
            <p>Loading your available permissions...</p>
          ) : permissionsError ? (
            <p style={{ color: '#b91c1c' }}>
              {permissionsError}
            </p>
          ) : permissions.length === 0 ? (
            <p style={{ color: '#64748b' }}>
              No permissions were returned for your account.
            </p>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '22px',
                marginTop: '18px',
              }}
            >
              {permissionCategories.map((category) => {
                const allSelected = isCategorySelected(
                  category.permissions
                );

                return (
                  <section key={category.id}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #e2e8f0',
                        paddingBottom: '9px',
                        marginBottom: '12px',
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          color: '#0f172a',
                          fontSize: '15px',
                          fontWeight: 700,
                        }}
                      >
                        {category.name}
                      </h4>

                      <button
                        type="button"
                        onClick={() =>
                          toggleCategory(category.permissions)
                        }
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#1d4ed8',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '11px',
                        paddingLeft: '5px',
                      }}
                    >
                      {category.permissions.map((permission) => {
                        const id = getPermissionId(permission);
                        const name = getPermissionName(permission);

                        return (
                          <label
                            key={id}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              color: '#334155',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(id)}
                              onChange={() => togglePermission(id)}
                              style={{
                                marginTop: '3px',
                                cursor: 'pointer',
                              }}
                            />

                            <span>
                              <span style={{ display: 'block' }}>
                                {name.replaceAll('_', ' ')}
                              </span>

                              {permission.description && (
                                <small
                                  style={{
                                    display: 'block',
                                    color: '#64748b',
                                    marginTop: '3px',
                                  }}
                                >
                                  {permission.description}
                                </small>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {error && (
            <p style={{ color: '#b91c1c', marginTop: '16px' }}>
              {error}
            </p>
          )}

          {success && (
            <p style={{ color: '#15803d', marginTop: '16px' }}>
              {success}
            </p>
          )}

          {/* ACTIONS */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '26px',
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              style={{
                padding: '11px 20px',
                border: '1px solid #cbd5e1',
                background: '#fff',
                borderRadius: '7px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                permissionsLoading ||
                Boolean(permissionsError)
              }
              style={{
                padding: '11px 22px',
                border: 'none',
                background: '#1d4ed8',
                color: '#fff',
                borderRadius: '7px',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Creating...' : 'Create Group & Leader'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
