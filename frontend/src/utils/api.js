const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Helper function to get auth token
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
    const token = getAuthToken();
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
};

// Authentication API functions
export const loginUser = async (email, password) => {
    return apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
};

export const registerUser = async (name, email, password, confirmPassword) => {
    return apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, confirmPassword }),
    });
};

// Task API functions
export const getTasks = async (status = null) => {
    const params = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiRequest(`/tasks${params}`);
};

export const getTask = async (taskId) => {
    return apiRequest(`/tasks/${taskId}`);
};

export const createTask = async (taskData) => {
    return apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
    });
};

export const updateTask = async (taskId, taskData) => {
    return apiRequest(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(taskData),
    });
};

export const deleteTask = async (taskId) => {
    return apiRequest(`/tasks/${taskId}`, {
        method: 'DELETE',
    });
};

// Health check
export const checkApiHealth = async () => {
    try {
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
        return response.ok;
    } catch (error) {
        return false;
    }
};

// Export API base URL for other uses
export { API_BASE_URL };