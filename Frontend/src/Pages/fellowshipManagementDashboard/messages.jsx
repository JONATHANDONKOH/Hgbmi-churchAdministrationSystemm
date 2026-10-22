import '../../styles/administrationManagement.css';

export default function FellowshipMessagesPage() {
  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Fellowship</p>
          <h1 className="administration-title">Messages</h1>
        </div>
      </header>

      <section className="administration-stats" aria-label="Messages overview">
        <article className="administration-card">
          <p className="administration-card-label">Unread</p>
          <p className="administration-card-value">19</p>
          <p className="administration-card-detail">Messages requiring attention</p>
        </article>
        <article className="administration-card">
          <p className="administration-card-label">Sent</p>
          <p className="administration-card-value">42</p>
          <p className="administration-card-detail">Messages distributed this month</p>
        </article>
        <article className="administration-card">
          <p className="administration-card-label">Responses</p>
          <p className="administration-card-value">28</p>
          <p className="administration-card-detail">Replies received from members</p>
        </article>
      </section>
    </div>
  );
}
