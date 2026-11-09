import { useEffect, useState } from 'react';
import MessagingAPI from '../../services/messagingApi';

function NewChatModal({ onClose, onCreated }) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatingId, setCreatingId] = useState(null);
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
        setError('');

        const data = await MessagingAPI.searchUsers(search.trim());

        if (active) {
          setUsers(data.users || []);
        }
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

  async function startChat(user) {
    try {
      setCreatingId(user.id);
      setError('');

      const data =
        await MessagingAPI.createPrivateConversation(user.id);

      await onCreated(data.conversation);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingId(null);
    }
  }

  return (
    <div className="messaging-modal-backdrop" onMouseDown={onClose}>
      <div
        className="messaging-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>New private chat</h2>
          <button type="button" onClick={onClose}>×</button>
        </div>

        <input
          className="modal-search"
          placeholder="Search by name or email..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          autoFocus
        />

        {error && <p className="messaging-error">{error}</p>}

        <div className="modal-user-list">
          {loading && <p>Searching...</p>}

          {!loading && search.trim().length >= 2 && users.length === 0 && (
            <p>No users found.</p>
          )}

          {users.map((user) => (
            <button
              type="button"
              key={user.id}
              className="modal-user"
              onClick={() => startChat(user)}
              disabled={creatingId !== null}
            >
              <div className="conversation-avatar">
                {(user.full_name || 'U').charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>{user.full_name}</strong>
                <p>{user.email}</p>
              </div>

              {creatingId === user.id && <span>Opening...</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NewChatModal;