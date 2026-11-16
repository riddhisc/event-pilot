import AppLayout from '../components/common/AppLayout';
import { PageHeader } from '../components/ui/kit';
import { useAuth } from '../hooks/useAuth';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  return (
    <AppLayout role={currentUser?.role || 'staff'}>
      <PageHeader title="Profile" />
      <section className="card">
        <h2>{currentUser?.name}</h2>
        <p>{currentUser?.email}</p>
        <p>{currentUser?.title} · {currentUser?.department}</p>
        <p className="mono">{currentUser?.id}</p>
      </section>
    </AppLayout>
  );
};

export default ProfilePage;
