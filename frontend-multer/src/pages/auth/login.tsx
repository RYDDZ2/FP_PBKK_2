// src/pages/auth/login.tsx

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext'; 
import { API_BASE_URL } from '../../utils/api';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/tasks'); 
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }

        const data = await response.json();
        const { token, user: userData } = data; 

        login(token, userData); 
        router.push('/tasks');

    } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Login error: ${message}. Pastikan server backend berjalan.`);
    } finally {
        setLoading(false);
    }
  };

  if (user) {
    return <div className="p-4 text-center">Redirecting...</div>;
  }

  return (
    <div className="container mx-auto p-4" style={{ maxWidth: '400px' }}>
      <h1 className="text-3xl font-bold mb-4 text-center">Login</h1>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="username" className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-100"
        >
          {loading ? 'Logging In...' : 'Login'}
        </button>
      </form>
      <p className="mt-3 text-center">
        Belum punya akun? <Link href="/auth/register" className="text-primary">Daftar di sini</Link>
      </p>
    </div>
  );
};

export default LoginPage;