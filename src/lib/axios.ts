import axios from 'axios';

const instance = axios.create({
    baseURL: 'https://localhost:7018',
    timeout: 1000,
    withCredentials: true
});

export default instance;