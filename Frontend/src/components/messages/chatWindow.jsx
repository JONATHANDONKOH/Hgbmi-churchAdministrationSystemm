import { useEffect, useRef, useState } from 'react';
import MessageBubble from './messageBubble';

function ChatWindow({
  conversation,
  messages,
  currentUserId,
  onSend,
  loading,
}) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmed = content.trim();

    if (!trimmed || sending || !conversation) return;

    try {
      setSending(true);
      await onSend(trimmed);
      setContent('');
    } finally {
      setSending(false);
    }
  }

  if (!conversation) {
    return (
      <section className="chat-empty">
        <div>
          <h2>Your messages</h2>
          <p>Select a conversation or start a new chat.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="chat-window">
      <header className="chat-header">
        <div className="conversation-avatar">
          {(conversation.title ||
            conversation.other_user_name ||
            'C').charAt(0).toUpperCase()}
        </div>

        <div>
          <h3>
            {conversation.title ||
              conversation.other_user_name ||
              'Private conversation'}
          </h3>

          <p>
            {conversation.type === 'group'
              ? 'Group conversation'
              : 'Private conversation'}
          </p>
        </div>
      </header>

      <div className="chat-messages">
        {loading ? (
          <p className="messaging-empty">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="messaging-empty">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              currentUserId={currentUserId}
            />
          ))
        )}

        <div ref={bottomRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Write a message..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={5000}
        />

        <button
          type="submit"
          disabled={!content.trim() || sending}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </section>
  );
}

export default ChatWindow;
