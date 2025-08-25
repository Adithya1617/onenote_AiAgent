'use client';

import { Button, Textarea } from '@/components/ui';
import { FileUploader } from '@/components/upload';
import { cn } from '@/lib/utils';
import { FileUpload } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Book, ChevronDown, Paperclip, Send, Settings } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface ChatInputProps {
  onSendMessage: (text?: string, files?: FileUpload[]) => void;
  uploads: FileUpload[];
  onFileSelect: (file: File) => void;
  onRemoveFile: (id: string) => void;
  isLoading: boolean;
  selectedNotebook?: string;
  selectedSection?: string;
  onNotebookChange: (notebook: string, section: string) => void;
}

export function ChatInput({
  onSendMessage,
  uploads,
  onFileSelect,
  onRemoveFile,
  isLoading,
  selectedNotebook,
  selectedSection,
  onNotebookChange,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [showUploader, setShowUploader] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleSend = () => {
    if (!text.trim() && uploads.length === 0) return;
    
    onSendMessage(text.trim() || undefined, uploads.length > 0 ? uploads : undefined);
    setText('');
    setShowUploader(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasContent = text.trim() || uploads.length > 0;

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 rounded-lg p-4 border"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Book className="w-4 h-4" />
                  OneNote Destination
                </h4>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notebook
                  </label>
                  <select
                    value={selectedNotebook || ''}
                    onChange={(e) => onNotebookChange(e.target.value, selectedSection || '')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Auto-select</option>
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Projects">Projects</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section
                  </label>
                  <select
                    value={selectedSection || ''}
                    onChange={(e) => onNotebookChange(selectedNotebook || '', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    disabled={!selectedNotebook}
                  >
                    <option value="">Auto-select</option>
                    <option value="Meetings">Meetings</option>
                    <option value="Tasks">Tasks</option>
                    <option value="Notes">Notes</option>
                  </select>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Leave blank for automatic notebook and section selection based on content.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File Uploader */}
        <AnimatePresence>
          {showUploader && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <FileUploader
                uploads={uploads}
                onFileSelect={onFileSelect}
                onRemoveFile={onRemoveFile}
                disabled={isLoading}
                className="border-0"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="flex gap-3 items-end">
          {/* Action Buttons */}
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUploader(!showUploader)}
              className={cn(
                "w-10 h-10 p-0",
                showUploader ? "bg-blue-100 text-blue-600" : ""
              )}
              disabled={isLoading}
            >
              <Paperclip className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "w-10 h-10 p-0",
                showSettings ? "bg-blue-100 text-blue-600" : ""
              )}
              disabled={isLoading}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          {/* Text Input */}
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message or upload files..."
              disabled={isLoading}
              className="min-h-[48px] max-h-[120px] resize-none"
              rows={1}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!hasContent || isLoading}
            className="w-12 h-12 p-0 rounded-xl"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {/* Status */}
        {selectedNotebook && selectedSection && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Book className="w-4 h-4" />
            <span>
              Will save to: <strong>{selectedNotebook} → {selectedSection}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
