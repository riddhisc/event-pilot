import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import Loader from './components/common/Loader';
import ProtectedRoute from './components/common/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { EventProvider } from './contexts/EventContext';
import { NotificationProvider } from './contexts/NotificationContext';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/auth/Login'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const EventManagement = lazy(() => import('./pages/admin/EventManagement'));
const StaffDirectory = lazy(() => import('./pages/admin/StaffDirectory'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const StaffDashboard = lazy(() => import('./pages/staff/Dashboard'));
const EventDetails = lazy(() => import('./pages/staff/EventDetails'));
const MyEvents = lazy(() => import('./pages/staff/MyEvents'));
const Networking = lazy(() => import('./pages/staff/Networking'));
const Clients = lazy(() => import('./pages/fde/Clients'));
const Onboarding = lazy(() => import('./pages/fde/Onboarding'));
const Integrations = lazy(() => import('./pages/fde/Integrations'));
const ConfigEditor = lazy(() => import('./pages/fde/ConfigEditor'));
const Support = lazy(() => import('./pages/fde/Support'));
const Adoption = lazy(() => import('./pages/fde/Adoption'));
const NotFound = lazy(() => import('./pages/NotFound'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminEventDetail = lazy(() => import('./pages/admin/EventDetail'));

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
          <EventProvider>
            <NotificationProvider>
              <Suspense fallback={<Loader />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/events" element={<ProtectedRoute allowedRole="admin"><EventManagement /></ProtectedRoute>} />
                  <Route path="/admin/events/:id" element={<ProtectedRoute allowedRole="admin"><AdminEventDetail /></ProtectedRoute>} />
                  <Route path="/admin/staff" element={<ProtectedRoute allowedRole="admin"><StaffDirectory /></ProtectedRoute>} />
                  <Route path="/admin/reports" element={<ProtectedRoute allowedRole="admin"><Reports /></ProtectedRoute>} />

                  <Route path="/staff/dashboard" element={<ProtectedRoute allowedRole="staff"><StaffDashboard /></ProtectedRoute>} />
                  <Route path="/staff/events/:id" element={<ProtectedRoute allowedRole="staff"><EventDetails /></ProtectedRoute>} />
                  <Route path="/staff/my-events" element={<ProtectedRoute allowedRole="staff"><MyEvents /></ProtectedRoute>} />
                  <Route path="/staff/networking" element={<ProtectedRoute allowedRole="staff"><Networking /></ProtectedRoute>} />

                  <Route path="/fde" element={<ProtectedRoute allowedRole="fde"><Clients /></ProtectedRoute>} />
                  <Route path="/fde/onboarding" element={<ProtectedRoute allowedRole="fde"><Onboarding /></ProtectedRoute>} />
                  <Route path="/fde/onboarding/:tenantId" element={<ProtectedRoute allowedRole="fde"><Onboarding /></ProtectedRoute>} />
                  <Route path="/fde/integrations" element={<ProtectedRoute allowedRole="fde"><Integrations /></ProtectedRoute>} />
                  <Route path="/fde/config" element={<ProtectedRoute allowedRole="fde"><ConfigEditor /></ProtectedRoute>} />
                  <Route path="/fde/support" element={<ProtectedRoute allowedRole="fde"><Support /></ProtectedRoute>} />
                  <Route path="/fde/adoption" element={<ProtectedRoute allowedRole="fde"><Adoption /></ProtectedRoute>} />

                  <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </NotificationProvider>
          </EventProvider>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
