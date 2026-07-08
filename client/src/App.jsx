import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard';
import Problems from './pages/Problems';
import Topics from './pages/Topics';

const ComingSoon = ({ title }) => (
  <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
    <div className="text-center">
      <p className="text-5xl mb-4">🚧</p>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-gray-400">Coming in next phase</p>
    </div>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              border: '1px solid #374151',
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/problems" element={
            <ProtectedRoute><Problems /></ProtectedRoute>
          } />
          <Route path="/topics" element={
            <ProtectedRoute><Topics/></ProtectedRoute>
          } />
          <Route path="/revision" element={
            <ProtectedRoute><ComingSoon title="Revision" /></ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute><ComingSoon title="Analytics" /></ProtectedRoute>
          } />
          <Route path="/companies" element={
            <ProtectedRoute><ComingSoon title="Companies" /></ProtectedRoute>
          } />
          <Route path="/contests" element={
            <ProtectedRoute><ComingSoon title="Contests" /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><ComingSoon title="Profile" /></ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;