import Sidebar from '../components/Sidebar';

function DepartmentLayout({ children, navigation }) {
  return (
    <div className="dashboard">
      <Sidebar navigation={navigation} />
      <main className="dashboard-content">{children}</main>
    </div>
  );
}

export default DepartmentLayout;