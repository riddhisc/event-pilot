export function homeFor(user) {
  if (!user) return '/login';
  if (user.role === 'admin') return '/admin/dashboard';
  if (user.role === 'fde') return '/fde';
  return '/staff/dashboard';
}
