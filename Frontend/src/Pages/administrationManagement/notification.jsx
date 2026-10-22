import '../../styles/administrationManagement.css';

const notificationsData = [
  { title: 'Unread alerts', value: '07', detail: 'Across departments' },
  { title: 'Today', value: '03', detail: 'New updates received' },
  { title: 'Critical', value: '01', detail: 'Needs follow-up' },
];

export default function AdministrationNotifications() {
  return (
    <div className="administration-section-page">
      <header className="administration-page-header">
        <div>
          <p className="administration-eyebrow">Administration</p>
          <h1 className="administration-title">Notifications</h1>
        </div>
      </header>

      <section className="administration-stats" aria-label="Notifications overview">
        {notificationsData.map((item) => (
          <article key={item.title} className="administration-card">
            <p className="administration-card-label">{item.title}</p>
            <p className="administration-card-value">{item.value}</p>
            <p className="administration-card-detail">{item.detail}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
