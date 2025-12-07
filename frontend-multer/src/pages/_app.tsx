// _app.tsx

import type { AppProps } from "next/app";
import "bootstrap/dist/css/bootstrap.min.css";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

function Navigation() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        {/* FIX: Ganti Posts App menjadi Tasks App */}
        <a className="navbar-brand" href="/">
          Tasks App
        </a>
        <div className="navbar-nav me-auto">
          {/* FIX: Ganti All Posts menjadi Public Tasks */}
          <a className="nav-link" href="/tasks/public">
            Public Tasks
          </a>
          {user && (
            // FIX: Tambahkan link ke My Tasks
            <a className="nav-link" href="/tasks">
              My Tasks
            </a>
          )}
          {user && (
            // FIX: Ganti /posts/new menjadi /tasks/new
            <a className="nav-link" href="/tasks/new">
              New Task
            </a>
          )}
        </div>
        <div className="navbar-nav">
          {user ? (
            <>
              <span className="navbar-text me-3">
                Welcome, {user.username}!
              </span>
              <button
                className="btn btn-outline-light btn-sm"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a className="nav-link" href="/auth/login">
                Login
              </a>
              <a className="nav-link" href="/auth/register">
                Register
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function AppContent({ Component, pageProps }: AppProps) {
  return (
    <>
      <Navigation />
      <div className="container mt-4">
        <Component {...pageProps} />
      </div>
    </>
  );
}

export default function App(props: AppProps) {
  return (
    <AuthProvider>
      <AppContent {...props} />
    </AuthProvider>
  );
}