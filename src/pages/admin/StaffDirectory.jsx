import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../../components/common/AppLayout';
import { Avatar, Badge, DataTable, Modal, PageHeader, Skeleton } from '../../components/ui/kit';
import { useToast } from '../../components/ui/Toast';
import { fetchStaff, updateStaffStatus } from '../../services/eventService';
import { previewInvites, resendInvite } from '../../services/platformService';

const StaffDirectory = () => {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const staff = useQuery({ queryKey: ['staff'], queryFn: fetchStaff });
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState('staff');
  const [department, setDepartment] = useState('Engineering');
  const [busy, setBusy] = useState(false);
  const preview = previewInvites(emails);
  const rows = (staff.data || []).filter((person) => person.role !== 'fde');

  const send = async () => {
    setBusy(true);
    const valid = preview.filter((row) => !row.error);
    for (const row of valid) await resendInvite(row.email);
    setBusy(false);
    setOpen(false);
    setEmails('');
    push({ title: valid.length ? `Queued ${valid.length} invite${valid.length === 1 ? '' : 's'}` : 'No valid emails to send', tone: valid.length ? 'success' : 'warning' });
  };

  return (
    <AppLayout role="admin">
      <PageHeader title="Staff directory" actions={<button type="button" className="btn" onClick={() => setOpen(true)}>Invite staff</button>} />
      {staff.isLoading ? <Skeleton /> : (
        <DataTable
          rows={rows}
          searchKeys={['name', 'email', 'department']}
          filters={[
            { key: 'role', label: 'Role', options: ['admin', 'staff'] },
            { key: 'department', label: 'Department', options: [...new Set(rows.map((row) => row.department).filter(Boolean))] },
          ]}
          empty="No staff match."
          columns={[
            { key: 'name', header: 'Name', render: (row) => <span><Avatar name={row.name} /> {row.name}</span> },
            { key: 'role', header: 'Role', render: (row) => <Badge status={row.role}>{row.role}</Badge> },
            { key: 'department', header: 'Department' },
            { key: 'email', header: 'Email' },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.status}>{row.status || 'active'}</Badge> },
          ]}
          rowActions={(row) => [
            { label: 'Edit', onClick: () => push({ title: 'Profile edits save with the next staff import' }) },
            { label: 'Disable', onClick: async () => { await updateStaffStatus(row.id, 'disabled'); await queryClient.invalidateQueries({ queryKey: ['staff'] }); push({ title: `${row.name} disabled` }); } },
            ...(row.status === 'invited' ? [{ label: 'Resend invite', onClick: async () => { await resendInvite(row.email); push({ title: `Invite requeued for ${row.email}` }); } }] : []),
          ]}
        />
      )}
      <Modal open={open} title="Invite staff" onClose={() => setOpen(false)}>
        <label htmlFor="invite-emails">Emails or CSV</label>
        <textarea id="invite-emails" rows="5" value={emails} onChange={(event) => setEmails(event.target.value)} placeholder={'one@northwind.example\ntwo@northwind.example'} />
        <label htmlFor="invite-role">Role</label>
        <select id="invite-role" value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
        <label htmlFor="invite-dept">Department</label>
        <input id="invite-dept" value={department} onChange={(event) => setDepartment(event.target.value)} />
        {preview.length > 0 && (
          <ul>
            {preview.map((row) => <li key={row.email}>{row.email} {row.error && <span className="error-message">{row.error}</span>}</li>)}
          </ul>
        )}
        <button type="button" className="btn" disabled={busy || preview.every((row) => row.error)} onClick={send}>{busy ? 'Sending...' : `Send ${role} invites`}</button>
      </Modal>
    </AppLayout>
  );
};

export default StaffDirectory;
