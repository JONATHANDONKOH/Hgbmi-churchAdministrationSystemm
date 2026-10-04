import Card from '../component/Cards';
import Button from '../component/button';
import '../styles/ui.css';

function SuperAdminDashboard() {
  return (
    <>
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">Administration</p>
            <h1>General Admin Dashboard</h1>
          </div>
          <div className="dashboard-actions">
            <label className="search-bar">
              <span className="sr-only">Search dashboard</span>
              <input type="search" placeholder="Search dashboard" />
            </label>
            <Button />
          </div>
        </header>
        <section className="dashboard-cards" aria-label="Dashboard overview">
          <Card />
        </section>
    </>
  );
}

export default SuperAdminDashboard;