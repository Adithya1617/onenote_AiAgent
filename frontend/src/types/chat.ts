export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageType = 'text' | 'image' | 'audio' | 'file';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  timestamp: Date;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    processingStatus?: 'pending' | 'processing' | 'completed' | 'error';
  };
}

export interface FileUpload {
  id: string;
  file: File;
  type: MessageType;
  preview?: string;
  uploadProgress?: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentUploads: FileUpload[];
}

export interface OneNoteRoute {
  notebook: string | null;
  section: string | null;
}

export interface LLMResponse {
  summary_md: string;
  route: OneNoteRoute;
  raw_llm?: string;
}
