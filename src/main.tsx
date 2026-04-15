import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { logger } from '@/lib/logger';

// Global safety net for unhandled async errors (Firebase calls, etc.)
window.addEventListener('unhandledrejection', (event) => {
  logger.error('[Unhandled Promise Rejection]', event.reason);
});

// Ensure the root element exists before attempting to render
const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <App />
  );
} else {
  logger.error("[main] Fatal: 'root' element not found in index.html — application cannot mount.");
}
