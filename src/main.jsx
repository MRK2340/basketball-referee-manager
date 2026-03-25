import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

// Ensure the root element exists before attempting to render
const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <App />
  );
} else {
  console.error("Fatal Error: 'root' element not found in index.html. Application cannot mount.");
}