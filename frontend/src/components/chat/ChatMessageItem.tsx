'use client';

import { Button } from '@/components/ui';
import { cn, formatTimestamp } from '@/lib/utils';
import { ChatMessage } from '@/types';
import { motion } from 'framer-motion';
import { Bot, Check, Copy, File, FileText, Image as ImageIcon, Music, User } from 'lucide-react';
import { useState } from 'react';

interface ChatMessageItemProps {
  message: ChatMessage;
  isLast?: boolean;
}

export function ChatMessageItem({ message, isLast }: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getMessageIcon = () => {
    if (message.role === 'assistant') {
      return <Bot className="w-5 h-5" />;
    }
    
    switch (message.type) {
      case 'image': return <ImageIcon className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      case 'file': return <File className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const getAvatarBg = () => {
    if (message.role === 'assistant') {
      return 'bg-blue-100 text-blue-700';
    }
    return 'bg-gray-700 text-white';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex gap-4 group",
        isUser ? "justify-end" : "justify-start",
        isLast ? "mb-6" : "mb-4"
      )}
    >
      {/* Assistant Avatar */}
      {!isUser && (
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          getAvatarBg()
        )}>
          {getMessageIcon()}
        </div>
      )}

      {/* Message Content */}
      <div className={cn(
        "max-w-2xl rounded-2xl px-4 py-3 shadow-sm",
        isUser 
          ? "bg-blue-600 text-white rounded-br-md" 
          : "bg-white border border-gray-200 rounded-bl-md"
      )}>
        {/* Message Text */}
        <div className={cn(
          "prose prose-sm max-w-none",
          isUser ? "prose-invert" : ""
        )}>
          {(message.content ?? "").toString().split('\n').map((line, index) => (
            <p key={index} className={cn(
              "mb-2 last:mb-0",
              line.startsWith('**') && line.endsWith('**') ? "font-semibold" : "",
              line.startsWith('✅') || line.startsWith('📝') ? "text-sm" : ""
            )}>
              {line.replace(/\*\*(.*?)\*\*/g, '$1')}
            </p>
          ))}
        </div>

        {/* File Metadata */}
        {message.metadata && (
          <div className={cn(
            "mt-2 pt-2 border-t text-xs",
            isUser ? "border-blue-500 text-blue-100" : "border-gray-200 text-gray-500"
          )}>
            {message.metadata.fileName && (
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>{message.metadata.fileName}</span>
                {message.metadata.fileSize && (
                  <span>• {Math.round(message.metadata.fileSize / 1024)}KB</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Message Actions */}
        <div className={cn(
          "flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity",
          "text-xs",
          isUser ? "text-blue-200" : "text-gray-500"
        )}>
          <span>{formatTimestamp(message.timestamp)}</span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className={cn(
              "h-6 px-2 text-xs",
              isUser 
                ? "hover:bg-blue-500 text-blue-200 hover:text-white" 
                : "hover:bg-gray-100"
            )}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          getAvatarBg()
        )}>
          {getMessageIcon()}
        </div>
      )}
    </motion.div>
  );
}
