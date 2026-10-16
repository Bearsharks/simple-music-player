import 'app/App.scss';
import { lazy, Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Spinner from 'shared/ui/Spinner';
const Main = lazy(() => import('features/navigation/pages/Main'));
export default function App() {
  return <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}><Suspense fallback={<Spinner />}><Main /></Suspense></BrowserRouter>;
}
