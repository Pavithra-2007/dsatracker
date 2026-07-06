import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DashboardLayout = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Navbar title={title} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;