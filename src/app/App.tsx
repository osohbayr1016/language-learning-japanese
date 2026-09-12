import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import RootLayout from './RootLayout';
import { routes } from './routes';

const router = createBrowserRouter([
  { path: '/', Component: RootLayout, children: routes },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
