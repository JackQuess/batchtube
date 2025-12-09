import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { LandingPage } from './pages/LandingPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const url = new URL(window.location.href);
const isAppRoute = window.location.pathname.startsWith('/app') || url.searchParams.get('view') === 'app';
const RootComponent = isAppRoute ? App : LandingPage;

root.render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);
