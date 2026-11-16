import AppLayout from '../components/common/AppLayout';
import NotificationCenter from '../components/staff/NotificationCenter';
import { PageHeader } from '../components/ui/kit';
import { useAuth } from '../hooks/useAuth';

const NotificationsPage = () => {
  const { currentUser } = useAuth();
  return (
    <AppLayout role={currentUser?.role || 'staff'}>
      <PageHeader title="Notifications" />
      <NotificationCenter />
    </AppLayout>
  );
};

export default NotificationsPage;
