function ConversationList({
  conversations,
  selectedConversation,
  onSelect,
  onNewChat,
  onNewGroup,
  loading,
}) {
  return (
    <section className="messaging-sidebar">
      <div className="messaging-sidebar-header">
        <div>
          <h2>Messages</h2>
          <p>Your conversations</p>
        </div>

        <div className="messaging-new-actions">
          <button type="button" onClick={onNewChat} title="New chat">
            +
          </button>

          <button
            type="button"
            onClick={onNewGroup}
            title="New group chat"
          >
            Group
          </button>
        </div>
      </div>

      <div className="conversation-list">
        {loading ? (
          <p className="messaging-empty">Loading conversations...</p>
        ) : conversations.length === 0 ? (
          <p className="messaging-empty">
            No conversations yet. Start a new chat.
          </p>
        ) : (
          conversations.map((conversation) => {
            const active =
              String(selectedConversation?.id) ===
              String(conversation.id);

            return (
              <button
                type="button"
                key={conversation.id}
                className={`conversation-item ${active ? 'active' : ''}`}
                onClick={() => onSelect(conversation)}
              >
                <div className="conversation-avatar">
                  {(conversation.title ||
                    conversation.other_user_name ||
                    'C').charAt(0).toUpperCase()}
                </div>

                <div className="conversation-details">
                  <div className="conversation-title-row">
                    <strong>
                      {conversation.title ||
                        conversation.other_user_name ||
                        'Private conversation'}
                    </strong>

                    {conversation.unread_count > 0 && (
                      <span className="conversation-unread">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>

                  <p>
                    {conversation.last_message || 'No messages yet'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

export default ConversationList;