import { ChatRequest, LLMResponse, NotebookSection } from '@/types';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      timeout: 30000, // 30 seconds for file uploads
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add any auth headers or request modifications here
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // Handle common errors here
        const errorMessage = error.response?.data?.error || error.message || 'An unexpected error occurred';
        return Promise.reject(new Error(errorMessage));
      }
    );
  }

  async sendChatMessage(request: ChatRequest): Promise<LLMResponse> {
    const formData = new FormData();
    
    if (request.text) {
      formData.append('text', request.text);
    }
    
    if (request.file) {
      formData.append('file', request.file);
    }
    
    if (request.mode) {
      formData.append('mode', request.mode);
    }
    
    if (request.target_notebook) {
      formData.append('target_notebook', request.target_notebook);
    }
    
    if (request.target_section) {
      formData.append('target_section', request.target_section);
    }

    const response = await this.client.post<LLMResponse>('/chat', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async getNotebooks(): Promise<NotebookSection[]> {
    const response = await this.client.get<NotebookSection[]>('/notebooks');
    return response.data;
  }

  async uploadFile(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<{ fileId: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    };

    const response = await this.client.post('/upload', formData, config);
    return response.data;
  }
}

// Create singleton instance
export const apiClient = new APIClient();

// Export individual methods for easier use
export const chatAPI = {
  sendMessage: (request: ChatRequest) => apiClient.sendChatMessage(request),
  getNotebooks: () => apiClient.getNotebooks(),
  uploadFile: (file: File, onProgress?: (progress: number) => void) => 
    apiClient.uploadFile(file, onProgress),
};
