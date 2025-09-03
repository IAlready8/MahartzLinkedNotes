import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../css/styles.css';
import '../css/react-components.css';

// // 👑 Guide: This is the new entry point for the React application.
// It finds the 'root' div in index.html and renders the main App component into it.
// All application logic will now flow from the App component and its children.

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Fatal: Could not find root element to mount React app.');
}
