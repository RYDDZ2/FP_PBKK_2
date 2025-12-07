// src/pages/tasks/new.tsx

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { API_BASE_URL } from '../../utils/api';
import { CreateTaskPayload, Priority } from '../../types/task';
import { Category } from '../../types/category';

const NewTaskPage: React.FC = () => {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  
  // FIX: dueDate sekarang valid karena Task interface diperbarui
  const [formData, setFormData] = useState<Omit<CreateTaskPayload, 'categoryId'>>({
    title: '',
    description: null, // Ganti dari '' ke null jika backend menerima null
    priority: 'medium',
    isCompleted: false,
    isPublic: false,
    dueDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategoryId(data[0].id); // Pilih kategori pertama sebagai default
        }
      } catch (err) {
        console.error('Category fetch error:', err);
        setError('Failed to load categories.');
      }
    };
    if (accessToken) {
        fetchCategories();
    }
  }, [accessToken]);

  // FIX: Mengatasi redline pada property 'checked'
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Gunakan Type Guard (cast to HTMLInputElement) untuk mengakses 'checked'
    const target = e.target as HTMLInputElement;

    setFormData((prev) => ({
      ...prev,
      [name]: target.type === 'checkbox' ? target.checked : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedCategoryId) return;

    setLoading(true);
    setError(null);

    try {
      const form = new FormData();
      
      // Mengubah string kosong menjadi null untuk Description (jika backend memerlukan null)
      const dataToSend = {
        ...formData,
        description: formData.description === '' ? null : formData.description,
        categoryId: selectedCategoryId,
      };

      // Append JSON payload
      form.append('data', JSON.stringify(dataToSend));

      // Append file (if present)
      if (file) {
        form.append('file', file);
      }

      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          // Penting: Hapus 'Content-Type': 'application/json' karena kita menggunakan FormData
        },
        body: form,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create task. Status: ${response.status}`);
      }

      router.push('/tasks');
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!accessToken) return <div className="p-8">Please login to create a task.</div>;

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Create New Task</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Priority */}
          <div>
            <label className="block text-sm font-medium">Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium">Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          {/* isCompleted */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isCompleted"
              checked={formData.isCompleted}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-sm font-medium">Is Completed</label>
          </div>

          {/* isPublic */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-sm font-medium">Is Public</label>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium">Attachment (Optional)</label>
            <input
              type="file"
              onChange={handleFileChange}
              className="mt-1 block w-full"
            />
          </div>

          {error && <p className="text-red-500">{error}</p>}
          
          <button
            type="submit"
            disabled={loading || !selectedCategoryId}
            className="bg-green-600 text-white px-4 py-2 rounded shadow-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
};

export default NewTaskPage;