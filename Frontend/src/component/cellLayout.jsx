import Sidebar from '../components/Sidebar';

function CellLayout({ children, navigation }) {
  return (
    <div className="dashboard dash-layout">
      <Sidebar navigation={navigation} />
      <main className="dashboard-content dash-content">{children}</main>
    </div>
  );
}

export default CellLayout;