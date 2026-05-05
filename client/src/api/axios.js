import axios from "axios";

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

// Attach Auth token to all network requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token && token !== "undefined" && token !== "null") {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        delete config.headers.Authorization;
    }

    return config;
});

export default api;