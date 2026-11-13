import { Navigate } from 'react-router-dom';
/** Start learning immediately; account creation and onboarding remain optional. */
export default function IndexRedirect() {
  return <Navigate to="/course" replace />;
}
