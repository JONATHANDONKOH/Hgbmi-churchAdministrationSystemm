import Sidebar from '../components/Sidebar';

function SuperAdminLayout({ children, navigation }) {
  return (
    <div className="dashboard">
      <Sidebar navigation={navigation} />
      <main className="dashboard-content">{children}</main>
    </div>
  );
}

export default SuperAdminLayout;