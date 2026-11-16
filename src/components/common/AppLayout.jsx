import Navbar from './Navbar';
import Sidebar from './Sidebar';

const AppLayout = ({ role = 'staff', children }) => (
  <div className={`${role}-layout app-shell`}>
    <Navbar />
    <div className="layout-container">
      <Sidebar type={role} />
      <main className="dashboard-content">{children}</main>
    </div>
  </div>
);

export default AppLayout;
