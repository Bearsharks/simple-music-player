import { ErrorBoundary } from './app/ErrorBoundary';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'jotai';
import App from './app/App';
import './app/index.css';
createRoot(document.getElementById('root')!).render(<StrictMode><Provider><ErrorBoundary><App /></ErrorBoundary></Provider></StrictMode>);
