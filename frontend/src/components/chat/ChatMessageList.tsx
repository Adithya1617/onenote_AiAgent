'use client';

import { ChatMessage } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ChatMessageItem } from './ChatMessageItem';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function ChatMessageList({ messages, isLoading }: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
      {/* Welcome Message */}
      {messages.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center h-full text-center py-12"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-blue-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome to OneNote AI
          </h3>
          
          <p className="text-gray-600 max-w-md mb-6">
            Upload images, audio files, or send text messages. I&apos;ll automatically process 
            and organize your content in OneNote.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                📝
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Text Processing</h4>
              <p className="text-sm text-gray-600">Send notes and I&apos;ll summarize and organize them</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                🖼️
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Image OCR</h4>
              <p className="text-sm text-gray-600">Extract text from images and documents</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                🎵
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Audio Transcription</h4>
              <p className="text-sm text-gray-600">Convert speech to text and create meeting notes</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Messages */}
      <AnimatePresence>
        {messages.map((message, index) => (
          <ChatMessageItem
            key={message.id}
            message={message}
            isLast={index === messages.length - 1 && !isLoading}
          />
        ))}
      </AnimatePresence>

      {/* Loading Indicator */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-start gap-4"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-700" />
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Processing your request...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={messagesEndRef} />
    </div>
  );
}
