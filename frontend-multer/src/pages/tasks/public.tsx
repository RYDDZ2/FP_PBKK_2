// src/pages/tasks/public.tsx

import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../utils/api';
import { Task } from '../../types/task'; 
import Link from 'next/link';

const PublicTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/tasks/public`); 

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to fetch public tasks. Status: ${response.status}`);
        }

        const data = await response.json();
        
        // FIX PENTING: Validasi data agar tasks.map tidak error
        if (Array.isArray(data)) {
            setTasks(data);
        } else {
            console.error("API returned non-array data:", data);
            throw new Error('Server returned invalid data format. Expected array of tasks.');
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred. Check backend server status.');
        setTasks([]); 
      } finally {
        setLoading(false);
      }
    };
    fetchPublicTasks();
  }, []);

  if (loading) return <div className="p-4 text-center">Loading Public Tasks...</div>;
  if (error) return <div className="p-4 text-danger text-center">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-4">Public Tasks</h1>
      
      {tasks.length === 0 ? (
          <div className="alert alert-info">No public tasks found.</div>
      ) : (
          <div className="list-group">
            {tasks.map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                <span className={task.isCompleted ? 'text-decoration-line-through' : ''}>
                    {task.title}
                </span>
                <span className={`badge ${task.isCompleted ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {task.isCompleted ? 'Completed' : 'Pending'}
                </span>
              </Link>
            ))}
          </div>
      )}
    </div>
  );
};

export default PublicTasksPage;