import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Card from '../../component/Cards';
import Button from '../../component/button';
import Sidebar from '../../components/Sidebar';
import { superAdminNavigation } from '../../Config/navigation.js';
import CreateAdministrator from '../adminstratorForm';
import '../../styles/ui.css';

function SuperAdminHome() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateAdministrator = async (payload) => {
    console.log('Create administrator payload:', payload);
    setShowCreateForm(false);
  };

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
          <Button onClick={() => setShowCreateForm(true)} />
        </div>
      </header>

      {showCreateForm && (
        <CreateAdministrator
          onCancel={() => setShowCreateForm(false)}
          onSubmit={handleCreateAdministrator}
        />
      )}

      <section className="dashboard-cards" aria-label="Dashboard overview">
        <Card />
      </section>
    </>
  );
}

function SuperAdminDashboard() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
      <Sidebar navigation={superAdminNavigation} />

      <main style={{ flex: 1, padding: '24px', color: '#111827' }}>
        <Outlet />
      </main>
    </div>
  );
}

SuperAdminDashboard.Home = SuperAdminHome;

export default SuperAdminDashboard;