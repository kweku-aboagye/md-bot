import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './dashboard.css'
import App from './App.tsx'
import { AuthProvider } from './AuthContext.tsx'
import { Terms } from './pages/Terms.tsx'
import { Privacy } from './pages/Privacy.tsx'

const path = window.location.pathname;

let root;
if (path === '/terms') {
  root = <Terms />;
} else if (path === '/privacy') {
  root = <Privacy />;
} else {
  root = (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{root}</StrictMode>,
)
