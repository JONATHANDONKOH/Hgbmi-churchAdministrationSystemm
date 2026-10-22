import { useState } from 'react';
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, CheckCheck, ShieldCheck, Users } from 'lucide-react';
import { Create } from '../../component/button';
import CreateGroupLeader from './groupForm';
import '../../styles/ui.css';
import '../../styles/Fellowship.css';
import '../../styles/administrationManagement.css';

const overview = [
  { label: 'Active leaders', value: '24', detail: 'Across 9 ministry teams', icon: Users },
  { label: 'Coverage rate', value: '92%', detail: 'Leadership positions filled', icon: ShieldCheck },
  { label: 'Team check-ins', value: '17', detail: 'Completed this week', icon: CheckCheck },
];

const ministryFocus = [
  { title: 'Pastoral team', members: '6 leaders', status: 'Fully staffed' },
  { title: 'Media & production', members: '4 leaders', status: 'On schedule' },
  { title: 'Operations & welfare', members: '5 leaders', status: 'Needs support' },
  { title: 'Administration & finance', members: '3 leaders', status: 'In review' },
];

const recentUpdates = [
  { title: 'Leadership huddle moved to Friday', detail: 'Operations team · Today' },
  { title: 'New volunteer onboarding packet approved', detail: 'Administration · Yesterday' },
  { title: 'Budget review checklist sent to all leaders', detail: 'Finance · 2 days ago' },
];

function AdministrationManagementDashboard() {
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);

  const handleCreateGroupSubmit = async (payload) => {
    console.log('Group leader payload:', payload);
    setShowCreateGroupForm(false);
  };

  return (
    <div>
      <header className="dashboard-header">
        <div>
          <p className="dash-eyebrow">Administration overview</p>
          <h1 className="dash-title">Administration Management</h1>
          <p className="dash-empty">Monitor leadership coverage, ministry readiness, and key operational updates.</p>
        </div>
        <div className="dashboard-actions">
          <p className="dash-empty">
            <CalendarDays size={17} aria-hidden="true" />
            Sunday, October 12
          </p>
          <Create onClick={() => setShowCreateGroupForm(true)} />
        </div>
      </header>

      {showCreateGroupForm && (
        <CreateGroupLeader
          onCancel={() => setShowCreateGroupForm(false)}
          onSubmit={handleCreateGroupSubmit}
        />
      )}

      <section className="dash-stats" aria-label="Administration overview statistics">
        {overview.map(({ label, value, detail, icon: Icon }) => (
          <article className="dash-card" key={label}>
            <p className="dash-card-label"><Icon size={17} aria-hidden="true" /> {label}</p>
            <p className="dash-card-value">{value}</p>
            <p className="dash-empty">{detail}</p>
          </article>
        ))}
      </section>

      <div>
        <section className="dash-section" aria-labelledby="ministry-focus-heading">
          <div className="dash-section-heading">
            <h2 id="ministry-focus-heading">
              Ministry focus <BriefcaseBusiness size={16} aria-hidden="true" />
            </h2>
          </div>

          <div className="administration-list">
            {ministryFocus.map((item) => (
              <div key={item.title} className="administration-list-item">
                <div>
                  <p className="administration-list-title">{item.title}</p>
                  <small>{item.members}</small>
                </div>
                <span className="administration-status">{item.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="dash-section" aria-labelledby="updates-heading">
          <div className="dash-section-heading">
            <h2 id="updates-heading">
              Recent updates <ArrowUpRight size={17} aria-hidden="true" />
            </h2>
          </div>

          <div className="administration-updates">
            {recentUpdates.map((update) => (
              <div key={update.title} className="administration-update-item">
                <p className="administration-update-title">{update.title}</p>
                <p className="administration-update-detail">{update.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdministrationManagementDashboard;
