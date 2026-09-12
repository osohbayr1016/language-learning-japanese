import { Outlet } from 'react-router-dom';
import { AuthLocaleProvider } from '@src/features/auth/AuthLocaleContext';

/** Was app/(auth)/_layout.tsx — the login/register screens need this locale. */
export default function AuthLayout() {
  return (
    <AuthLocaleProvider>
      <Outlet />
    </AuthLocaleProvider>
  );
}
