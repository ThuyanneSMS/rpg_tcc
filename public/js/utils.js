const API_URL = 'http://localhost:3000/api';

// Funções de Gerenciamento de Token
function saveToken(token) {
    localStorage.setItem('rpg_token', token);
}

function getToken() {
    return localStorage.getItem('rpg_token');
}

function removeToken() {
    localStorage.removeItem('rpg_token');
}

function isAuthenticated() {
    return !!getToken();
}

// Wrapper para as requisições API
async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro na requisição');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}
