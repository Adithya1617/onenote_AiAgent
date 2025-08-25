'use client';

import { ChatInput, ChatMessageList } from '@/components/chat';
import { Button } from '@/components/ui';
import { useChat } from '@/hooks/useChat';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, FileText, MessageCircle } from 'lucide-react';

export function OneNoteChatbot() {
  const {
    messages,
    isLoading,
    error,
    currentUploads,
    selectedNotebook,
    selectedSection,
    setSelectedNotebook,
    setSelectedSection,
    addFileUpload,
    removeUpload,
    sendMessage,
    clearChat,
  } = useChat();

  const handleFileSelect = async (file: File) => {
    await addFileUpload(file);
  };

  const handleNotebookChange = (notebook: string, section: string) => {
    setSelectedNotebook(notebook);
    setSelectedSection(section);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                OneNote AI Assistant
              </h1>
              <p className="text-sm text-gray-600">
                Intelligent content organization for Microsoft OneNote
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MessageCircle className="w-4 h-4" />
              <span>{messages.length} messages</span>
            </div>
            
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                disabled={isLoading}
              >
                Clear Chat
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border-b border-red-200 px-6 py-3"
          >
            <div className="flex items-center gap-3 max-w-4xl mx-auto">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-800">
                  <strong>Error:</strong> {error}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {/* Clear error would go here */}}
                className="text-red-600 hover:bg-red-100"
              >
                Dismiss
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <ChatMessageList
          messages={messages}
          isLoading={isLoading}
        />

        {/* Input */}
        <ChatInput
          onSendMessage={sendMessage}
          uploads={currentUploads}
          onFileSelect={handleFileSelect}
          onRemoveFile={removeUpload}
          isLoading={isLoading}
          selectedNotebook={selectedNotebook}
          selectedSection={selectedSection}
          onNotebookChange={handleNotebookChange}
        />
      </main>
    </div>
  );
}
