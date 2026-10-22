
import { useCallback, useEffect, useState } from 'react';
import SearchBar from '../../component/searchBar';
import '../../styles/administrationManagement.css';
import '../../styles/ui.css';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

export default function CellMembersPage({ groupId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  console.log('CellMembersPage rendered');
  console.log('Cell groupId:', groupId);
  console.log('API URL:', API_URL);

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

      console.log('Members API status:', response.status);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch members. HTTP ${response.status}`
        );
      }

      const data = await response.json();

      console.log('Members API response:', data);

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
      <div className="page-header">
        <h1>Cell Members</h1>
        <p>View and search members belonging to this cell.</p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <strong>Cell Group ID:</strong>{' '}
        {groupId || 'Not available'}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <strong>Total Members:</strong> {members.length}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search members by name, email, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '10px',
          }}
        />
      </div>

      {loading && <p>Loading cell members...</p>}

      {error && (
        <p style={{ color: 'red' }}>
          {error}
        </p>
      )}

      {!loading && !error && filteredMembers.length === 0 && (
        <p>No members found for this cell.</p>
      )}

      {!loading && filteredMembers.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px' }}>
                  Full Name
                </th>
                <th style={{ textAlign: 'left', padding: '10px' }}>
                  Email
                </th>
                <th style={{ textAlign: 'left', padding: '10px' }}>
                  Phone
                </th>
                <th style={{ textAlign: 'left', padding: '10px' }}>
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
                  <td style={{ padding: '10px' }}>
                    {member.full_name || member.name || 'N/A'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {member.email || 'N/A'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {member.phone_number || member.phone || 'N/A'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {member.role || 'Member'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
