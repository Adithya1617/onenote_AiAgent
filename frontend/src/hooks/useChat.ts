import { chatAPI } from '@/lib/api';
import { createFilePreview, generateId, getFileType } from '@/lib/utils';
import { ChatMessage, ChatState, FileUpload, LLMResponse, MessageType } from '@/types';
import { useCallback, useReducer, useState } from 'react';

type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_UPLOAD'; payload: FileUpload }
  | { type: 'UPDATE_UPLOAD'; payload: { id: string; updates: Partial<FileUpload> } }
  | { type: 'REMOVE_UPLOAD'; payload: string }
  | { type: 'CLEAR_UPLOADS' }
  | { type: 'CLEAR_MESSAGES' };

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
  currentUploads: [],
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'ADD_UPLOAD':
      return {
        ...state,
        currentUploads: [...state.currentUploads, action.payload],
      };
    case 'UPDATE_UPLOAD':
      return {
        ...state,
        currentUploads: state.currentUploads.map(upload =>
          upload.id === action.payload.id
            ? { ...upload, ...action.payload.updates }
            : upload
        ),
      };
    case 'REMOVE_UPLOAD':
      return {
        ...state,
        currentUploads: state.currentUploads.filter(upload => upload.id !== action.payload),
      };
    case 'CLEAR_UPLOADS':
      return {
        ...state,
        currentUploads: [],
      };
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
      };
    default:
      return state;
  }
}

export function useChat() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [selectedNotebook, setSelectedNotebook] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');

  const addMessage = useCallback((
    role: 'user' | 'assistant',
    content: string,
    type: MessageType = 'text',
    metadata?: any
  ) => {
    const message: ChatMessage = {
      id: generateId(),
      role,
      type,
      content,
      timestamp: new Date(),
      metadata,
    };
    dispatch({ type: 'ADD_MESSAGE', payload: message });
    return message;
  }, []);

  const addFileUpload = useCallback(async (file: File) => {
    const upload: FileUpload = {
      id: generateId(),
      file,
      type: getFileType(file),
      status: 'pending',
      uploadProgress: 0,
    };

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const preview = await createFilePreview(file);
      if (preview) {
        upload.preview = preview;
      }
    }

    dispatch({ type: 'ADD_UPLOAD', payload: upload });
    return upload;
  }, []);

  const updateUpload = useCallback((id: string, updates: Partial<FileUpload>) => {
    dispatch({ type: 'UPDATE_UPLOAD', payload: { id, updates } });
  }, []);

  const removeUpload = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_UPLOAD', payload: id });
  }, []);

  const sendMessage = useCallback(async (
    text?: string,
    files?: FileUpload[]
  ) => {
    if (!text?.trim() && (!files || files.length === 0)) {
      return;
    }

    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Add user message(s)
      if (text?.trim()) {
        addMessage('user', text, 'text');
      }

      if (files && files.length > 0) {
        for (const fileUpload of files) {
          addMessage(
            'user',
            `Uploaded: ${fileUpload.file.name}`,
            fileUpload.type,
            {
              fileName: fileUpload.file.name,
              fileSize: fileUpload.file.size,
              mimeType: fileUpload.file.type,
            }
          );
        }
      }

      // Process each file or text
      const responses: LLMResponse[] = [];

      if (files && files.length > 0) {
        for (const fileUpload of files) {
          updateUpload(fileUpload.id, { status: 'uploading' });
          
          const mode = fileUpload.type === 'file' ? 'text' : fileUpload.type as 'text' | 'image' | 'audio';
          
          const response = await chatAPI.sendMessage({
            text: text || undefined,
            file: fileUpload.file,
            mode,
            target_notebook: selectedNotebook || undefined,
            target_section: selectedSection || undefined,
          });

          responses.push(response);
          updateUpload(fileUpload.id, { status: 'completed' });
        }
      } else if (text?.trim()) {
        const response = await chatAPI.sendMessage({
          text,
          mode: 'text',
          target_notebook: selectedNotebook || undefined,
          target_section: selectedSection || undefined,
        });
        responses.push(response);
      }

      // Add assistant response(s)
      responses.forEach((response, index) => {
        const content = formatAssistantResponse(response);
        addMessage('assistant', content);
      });

      // Clear uploads after successful processing
      dispatch({ type: 'CLEAR_UPLOADS' });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Add error message to chat
      addMessage(
        'assistant',
        `❌ Sorry, I encountered an error: ${errorMessage}`,
        'text'
      );
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [addMessage, updateUpload, selectedNotebook, selectedSection]);

  const clearChat = useCallback(() => {
  // Properly clear messages/uploads and reset error state
  dispatch({ type: 'CLEAR_MESSAGES' });
    dispatch({ type: 'CLEAR_UPLOADS' });
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  return {
    ...state,
    selectedNotebook,
    selectedSection,
    setSelectedNotebook,
    setSelectedSection,
    addMessage,
    addFileUpload,
    updateUpload,
    removeUpload,
    sendMessage,
    clearChat,
  };
}

function formatAssistantResponse(response: LLMResponse): string {
  const { summary_md, route } = response;
  
  let content = `✅ **Content processed and added to OneNote**\n\n${summary_md}`;
  
  if (route.notebook && route.section) {
    content += `\n\n📝 **Location**: ${route.notebook} → ${route.section}`;
  }
  
  return content;
}
