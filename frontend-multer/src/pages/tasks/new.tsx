// pages/tasks/new.tsx

import React, { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import axios, { AxiosError } from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/api';
import { Button, Form, Alert, Spinner, Col, Row } from 'react-bootstrap';

// Tipe untuk Category
interface Category {
    id: string;
    name: string;
}

// Tipe untuk data Task baru
interface NewTaskData {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    isPublic: boolean;
    dueDate: string; // ISO Date string
    categoryId: string;
}

const NewTaskPage: React.FC = () => {
    const { user, accessToken, isAuthReady, logout } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState<NewTaskData>({
        title: '',
        description: '',
        priority: 'medium',
        isPublic: true,
        dueDate: '',
        categoryId: '',
    });

    const [file, setFile] = useState<File | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [catLoading, setCatLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // --- LOGIKA PROTECTED ROUTE & FETCH CATEGORIES ---
    useEffect(() => {
        if (isAuthReady && !user) {
            router.push('/auth/login');
            return;
        }

        if (accessToken) {
            const fetchCategories = async () => {
                try {
                    setCatLoading(true);
                    const response = await axios.get<Category[]>(`${API_BASE_URL}/categories`, {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    });
                    
                    setCategories(response.data);
                    // Set categoryId default jika ada kategori
                    if (response.data.length > 0) {
                        setFormData(prev => ({ ...prev, categoryId: response.data[0].id }));
                    }
                } catch (err) {
                    const axiosError = err as AxiosError;
                    if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
                         logout();
                         router.push('/auth/login');
                    }
                    setError(`Failed to load categories: ${axiosError.response?.data?.message || axiosError.message}`);
                } finally {
                    setCatLoading(false);
                }
            };
            fetchCategories();
        } else if (isAuthReady) {
            setCatLoading(false); // Auth ready, tapi token null, user akan dire-redirect
        }
    }, [isAuthReady, user, router, accessToken, logout]);

    // Handle input perubahan form
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Handle perubahan file
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        } else {
            setFile(null);
        }
    };

    // --- HANDLE SUBMISSION ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!accessToken) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // 1. Buat object FormData (untuk File Upload)
            const payload = new FormData();
            
            // 2. Tambahkan field form
            payload.append('title', formData.title);
            payload.append('description', formData.description);
            payload.append('priority', formData.priority);
            payload.append('isPublic', String(formData.isPublic));
            payload.append('dueDate', formData.dueDate); 

            if (formData.categoryId) {
                payload.append('categoryId', formData.categoryId);
            }

            // 3. Tambahkan file jika ada
            if (file) {
                payload.append('file', file); 
            }

            // 4. Kirim menggunakan Axios.
            const response = await axios.post(`${API_BASE_URL}/tasks`, payload, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            setSuccess(`Task created successfully! ID: ${response.data.id}`);
            // Reset form
            setFormData({ title: '', description: '', priority: 'medium', isPublic: true, dueDate: '', categoryId: categories[0]?.id || '' });
            setFile(null);
        } catch (err) {
            const axiosError = err as AxiosError;
             if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
                 logout();
                 router.push('/auth/login');
                 setError('Session expired. Please log in again.');
            } else {
                 setError(axiosError.response?.data?.message || 'Failed to create task. Check network or server logs.');
            }
        } finally {
            setLoading(false);
        }
    };

    // --- GUARD DAN LOADING AWAL (Fix "Cannot read properties of null") ---
    if (!isAuthReady) {
        return <div className="text-center mt-5"><Spinner animation="border" /> Authenticating...</div>;
    }

    if (!user) {
        return <div className="text-center mt-5">Access Denied. Redirecting...</div>;
    }

    if (catLoading) {
        return <div className="text-center mt-5"><Spinner animation="border" /> Loading categories...</div>;
    }

    // --- RENDERING FORM ---
    return (
        <div className="container mt-4">
            <h1 className="mb-4 text-success">Create New Task</h1>
            
            {success && <Alert variant="success">{success}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm">
                
                <Row>
                    {/* Judul */}
                    <Form.Group as={Col} className="mb-3" controlId="title">
                        <Form.Label>Title *</Form.Label>
                        <Form.Control
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </Form.Group>
                    
                    {/* Category */}
                    <Form.Group as={Col} md="4" className="mb-3" controlId="categoryId">
                        <Form.Label>Category *</Form.Label>
                        {categories.length === 0 ? (
                            <Alert variant="warning" className="p-2 py-0">No categories found. Create one first.</Alert>
                        ) : (
                            <Form.Select 
                                name="categoryId" 
                                value={formData.categoryId} 
                                onChange={handleChange}
                                required
                                disabled={loading}
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </Form.Select>
                        )}
                    </Form.Group>
                </Row>

                {/* Deskripsi */}
                <Form.Group className="mb-3" controlId="description">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </Form.Group>

                <Row>
                    {/* Priority */}
                    <Form.Group as={Col} md="4" className="mb-3" controlId="priority">
                        <Form.Label>Priority</Form.Label>
                        <Form.Select 
                            name="priority" 
                            value={formData.priority} 
                            onChange={handleChange}
                            required
                            disabled={loading}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </Form.Select>
                    </Form.Group>

                    {/* Due Date */}
                    <Form.Group as={Col} md="4" className="mb-3" controlId="dueDate">
                        <Form.Label>Due Date (Optional)</Form.Label>
                        <Form.Control
                            type="date"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </Form.Group>
                </Row>

                {/* File Upload */}
                <Form.Group className="mb-3" controlId="file">
                    <Form.Label>Attach File (Optional)</Form.Label>
                    <Form.Control
                        type="file"
                        onChange={handleFileChange}
                        disabled={loading}
                    />
                    <Form.Text className="text-muted">Max file size depends on server limits.</Form.Text>
                </Form.Group>

                {/* Is Public Checkbox */}
                <Form.Group className="mb-3" controlId="isPublic">
                    <Form.Check
                        type="checkbox"
                        label="Make this Task Publicly Visible"
                        name="isPublic"
                        checked={formData.isPublic}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </Form.Group>

                <Button variant="success" type="submit" disabled={loading || !formData.categoryId || !formData.title}>
                    {loading ? <Spinner animation="border" size="sm" /> : 'Create Task'}
                </Button>
            </Form>
        </div>
    );
};

export default NewTaskPage;