// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/api';

// interface ApiError {
//   message: string;
//   errors?: Record<string, string[]>;
// }

// class ApiService {
//   private token: string | null = null;

//   constructor() {
//     this.token = localStorage.getItem('auth_token');
//   }

//   setToken(token: string) {
//     this.token = token;
//     localStorage.setItem('auth_token', token);
//   }

//   clearToken() {
//     this.token = null;
//     localStorage.removeItem('auth_token');
//   }

//   getToken(): string | null {
//     return this.token;
//   }

//   private getHeaders(contentType = 'application/json') {
//     const headers: Record<string, string> = {
//       'Content-Type': contentType,
//       'Accept': 'application/json',
//     };

//     if (this.token) {
//       headers['Authorization'] = `Bearer ${this.token}`;
//     }

//     return headers;
//   }

//   async request(
//     method: string,
//     endpoint: string,
//     data?: unknown,
//   ) {
//     const url = `${API_BASE_URL}${endpoint}`;

//     const options: RequestInit = {
//       method,
//       headers: this.getHeaders(),
//     };

//     if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
//       options.body = JSON.stringify(data);
//     }

//     try {
//       const response = await fetch(url, options);
//       const result = await response.json();

//       if (!response.ok) {
//         const error: ApiError = result.message
//           ? { message: result.message, errors: result.errors }
//           : { message: 'An error occurred', errors: result.errors };
//         throw new Error(JSON.stringify(error));
//       }

//       return result.data;
//     } catch (error) {
//       if (error instanceof Error && error.message.startsWith('{')) {
//         throw JSON.parse(error.message);
//       }
//       throw error;
//     }
//   }

//   get(endpoint: string) {
//     return this.request('GET', endpoint);
//   }

//   post(endpoint: string, data?: Record<string, unknown>) {
//     return this.request('POST', endpoint, data);
//   }

//   put(endpoint: string, data: Record<string, unknown>) {
//     return this.request('PUT', endpoint, data);
//   }

//   delete(endpoint: string) {
//     return this.request('DELETE', endpoint);
//   }
// }

// export const apiService = new ApiService();

// export interface LoginPayload {
//   email: string;
//   password: string;
// }

// export interface LoginResponse {
//   token: string;
//   user: {
//     id: number;
//     name: string;
//     email: string;
//     role: string;
//   };
// }

// export interface RegisterPayload {
//   name: string;
//   email: string;
//   password: string;
//   password_confirmation: string;
// }

// export const authApi = {
//   login: (payload: LoginPayload) =>
//     apiService.post('/auth/login', payload) as Promise<LoginResponse>,

//   register: (payload: RegisterPayload) =>
//     apiService.post('/auth/register', payload as unknown as Record<string, unknown>) as Promise<LoginResponse>,

//   logout: () => apiService.post('/auth/logout'),

//   verify2FA: (email: string, code: string) =>
//     apiService.post('/auth/2fa/verify', { email, code }),
// };
