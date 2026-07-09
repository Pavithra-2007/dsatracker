import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

import Login     from './pages/Auth/Login';
import Register  from './pages/Auth/Register';
import Dashboard from './pages/Dashboard';
import Problems  from './pages/Problems';
import Topics    from './pages/Topics';
import Revision  from './pages/Revision';
import Analytics from './pages/Analytics';
import Companies from './pages/Companies';
import Contests  from './pages/Contests';
import Profile   from './pages/Profile';

const wrap = (Component) => (
  <ProtectedRoute><Component /></ProtectedRoute>
);

const App = () => (
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
        <Route path="/login"     element={<Login />} />
        <Route path="/register"  element={<Register />} />
        <Route path="/dashboard" element={wrap(Dashboard)} />
        <Route path="/problems"  element={wrap(Problems)}  />
        <Route path="/topics"    element={wrap(Topics)}    />
        <Route path="/revision"  element={wrap(Revision)}  />
        <Route path="/analytics" element={wrap(Analytics)} />
        <Route path="/companies" element={wrap(Companies)} />
        <Route path="/contests"  element={wrap(Contests)}  />
        <Route path="/profile"   element={wrap(Profile)}   />
        <Route path="/"          element={<Navigate to="/dashboard" replace />} />
        <Route path="*"          element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;