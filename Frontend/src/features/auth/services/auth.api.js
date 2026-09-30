import axios from 'axios';
import { API_URL } from '../../../config/api';

const api = axios.create({
    baseURL: API_URL,
  withCredentials: true,
});

export async function Register(username, email, password) {
    const response = await api.post("/api/auth/register", { username, email, password });
    return response.data;
}


export async function Login(email, password) {
    const response = await api.post("/api/auth/login", { email, password });
    return response.data;
}

export async function getMe(){
    const response = await api.get("/api/auth/getMe");
    return response.data;
}