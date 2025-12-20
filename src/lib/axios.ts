import axios from 'axios';
import { environment } from '../environments/environment';

const instance = axios.create({
    baseURL: environment.ASP_API_URL,
    timeout: 1000,
    withCredentials: true
});

export default instance;