import { Outlet } from 'react-router-dom';
import { OnboardingLocaleProvider } from '@src/features/onboarding/OnboardingLocaleContext';

/** Was app/(onboarding)/_layout.tsx. */
export default function OnboardingLayout() {
  return (
    <OnboardingLocaleProvider>
      <Outlet />
    </OnboardingLocaleProvider>
  );
}
