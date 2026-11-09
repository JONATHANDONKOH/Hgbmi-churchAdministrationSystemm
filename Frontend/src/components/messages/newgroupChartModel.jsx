import { useEffect, useState } from 'react';
import MessagingAPI from '../../services/messagingApi';

function NewGroupChatModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function searchUsers() {
      if (search.trim().length < 2) {
        setUsers([]);
        return;
      }

      try {
        setLoading(true);
        const data = await MessagingAPI.searchUsers(search.trim());

        if (active) setUsers(data.users || []);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    const timer = setTimeout(searchUsers, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  function toggleUser(user) {
    setSelectedUsers((current) => {
      const exists = current.some(
        (item) => String(item.id) === String(user.id)
      );

      return exists
        ? current.filter((item) => String(item.id) !== String(user.id))
        : [...current, user];
    });
  }

  async function createGroup(event) {
    event.preventDefault();

    if (!title.trim() || selectedUsers.length < 2) {
      setError('Enter a group name and select at least two people.');
      return;
    }

    try {
      setCreating(true);
      setError('');

      const data = await MessagingAPI.createGroupConversation(
        title.trim(),
        selectedUsers.map((user) => user.id)
      );

      await onCreated(data.conversation);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="messaging-modal-backdrop" onMouseDown={onClose}>
      <div
        className="messaging-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Create group chat</h2>
          <button type="button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={createGroup}>
          <input
            className="modal-search"
            placeholder="Group name"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />

          <input
            className="modal-search"
            placeholder="Search people..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="selected-users">
            {selectedUsers.map((user) => (
              <button
                type="button"
                key={user.id}
                onClick={() => toggleUser(user)}
              >
                {user.full_name} ×
              </button>
            ))}
          </div>

          {error && <p className="messaging-error">{error}</p>}

          <div className="modal-user-list">
            {loading && <p>Searching...</p>}

            {users.map((user) => {
              const selected = selectedUsers.some(
                (item) => String(item.id) === String(user.id)
              );

              return (
                <button
                  type="button"
                  key={user.id}
                  className={`modal-user ${selected ? 'selected' : ''}`}
                  onClick={() => toggleUser(user)}
                >
                  <div className="conversation-avatar">
                    {(user.full_name || 'U').charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <strong>{user.full_name}</strong>
                    <p>{user.email}</p>
                  </div>

                  <span>{selected ? 'Selected' : 'Select'}</span>
                </button>
              );
            })}
          </div>

          <button
            className="modal-submit"
            type="submit"
            disabled={creating}
          >
            {creating ? 'Creating...' : 'Create group'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default NewGroupChatModal;