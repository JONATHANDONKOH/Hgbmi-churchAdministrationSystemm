import { useEffect, useState } from 'react';
import MessagingAPI from '../../services/messagingApi';

function BroadcastPanel() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audienceType, setAudienceType] = useState('all_members');
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadBroadcasts() {
    try {
      setLoading(true);
      const data = await MessagingAPI.getBroadcasts();
      setBroadcasts(data.broadcasts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBroadcasts();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError('Enter both a title and announcement.');
      return;
    }

    try {
      setSending(true);
      setError('');
      setSuccess('');

      await MessagingAPI.sendBroadcast({
        title: title.trim(),
        content: content.trim(),
        audienceType,
      });

      setTitle('');
      setContent('');
      setSuccess('Announcement sent successfully.');
      await loadBroadcasts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="broadcast-panel">
      <div className="broadcast-compose">
        <h2>Create announcement</h2>
        <p>Send an announcement to an audience in the church.</p>

        <form onSubmit={handleSubmit}>
          <label>Announcement title</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Enter announcement title"
            maxLength={255}
            required
          />

          <label>Audience</label>
          <select
            value={audienceType}
            onChange={(event) => setAudienceType(event.target.value)}
          >
            <option value="all_members">All members</option>
            <option value="all_admins">All administrators</option>
            <option value="selected_groups">Selected church groups</option>
            <option value="selected_users">Selected individuals</option>
          </select>

          <p className="broadcast-hint">
            Selecting a group or individual audience will require recipient
            selection in the next stage of the broadcast workflow.
          </p>

          <label>Announcement message</label>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write your announcement..."
            rows={6}
            required
          />

          {error && <p className="messaging-error">{error}</p>}
          {success && <p className="messaging-success">{success}</p>}

          <button type="submit" disabled={sending}>
            {sending ? 'Sending...' : 'Send announcement'}
          </button>
        </form>
      </div>

      <div className="broadcast-history">
        <h2>Previous announcements</h2>

        {loading ? (
          <p>Loading announcements...</p>
        ) : broadcasts.length === 0 ? (
          <p>No announcements yet.</p>
        ) : (
          broadcasts.map((broadcast) => (
            <article className="broadcast-history-item" key={broadcast.id}>
              <div>
                <h3>{broadcast.title}</h3>
                <span>
                  {broadcast.audience_type?.replaceAll('_', ' ')}
                </span>
              </div>

              <p>{broadcast.content}</p>

              <small>
                {broadcast.created_at
                  ? new Date(broadcast.created_at).toLocaleString()
                  : ''}
              </small>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default BroadcastPanel;