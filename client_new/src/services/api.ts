const API_URL = '/api';
const AUTH_HEADER = { 'Authorization': 'Basic ' + btoa('admin:password') };

export const api = {
    get: async (endpoint: string) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: { ...AUTH_HEADER }
        });
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    },
    post: async (endpoint: string, data: any) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...AUTH_HEADER
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Network response was not ok');
        // Handle empty response for 200 OK
        const text = await response.text();
        return text ? JSON.parse(text) : {};
    }
};
