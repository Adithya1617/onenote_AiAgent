export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ChatRequest {
  text?: string;
  file?: File;
  mode?: 'text' | 'image' | 'audio';
  target_notebook?: string;
  target_section?: string;
}

export interface NotebookSection {
  notebook: string;
  sections: string[];
}
