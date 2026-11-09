function MessageBubble({ message, currentUserId }) {
  const isMine =
    String(message.sender_id) === String(currentUserId);

  const time = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className={`message-row ${isMine ? 'mine' : 'theirs'}`}>
      <div className="message-bubble">
        {!isMine && (
          <p className="message-sender">
            {message.sender_name || 'Unknown user'}
          </p>
        )}

        <p className="message-content">{message.content}</p>

        <span className="message-time">{time}</span>
      </div>
    </div>
  );
}

export default MessageBubble;