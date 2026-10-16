import 'app/App.scss';
import { lazy, Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Spinner from 'shared/ui/Spinner';
const Main = lazy(() => import('features/navigation/pages/Main'));
export default function App() {
  return <BrowserRouter basename="/simple-music-player"><Suspense fallback={<Spinner />}><Main /></Suspense></BrowserRouter>;
}
