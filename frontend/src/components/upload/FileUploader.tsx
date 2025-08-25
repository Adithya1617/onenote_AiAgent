'use client';

import { Button } from '@/components/ui';
import { cn, formatFileSize, getFileType } from '@/lib/utils';
import { FileUpload } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { File, FileText, Image as ImageIcon, Music, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface FileUploaderProps {
  uploads: FileUpload[];
  onFileSelect: (file: File) => void;
  onRemoveFile: (id: string) => void;
  disabled?: boolean;
  acceptedTypes?: string[];
  maxFileSize?: number; // in bytes
  className?: string;
}

export function FileUploader({
  uploads,
  onFileSelect,
  onRemoveFile,
  disabled = false,
  acceptedTypes = ['image/*', 'audio/*', '.txt', '.md', '.doc', '.docx', '.pdf'],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  className,
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || disabled) return;
    
    const files = Array.from(e.target.files);
    handleFiles(files);
    
    // Reset input
    e.target.value = '';
  };

  const handleFiles = (files: File[]) => {
    setError(null);
    
    for (const file of files) {
      // Check file size
      if (file.size > maxFileSize) {
        setError(`File "${file.name}" is too large. Maximum size is ${formatFileSize(maxFileSize)}.`);
        continue;
      }

      // Check file type
      const fileType = getFileType(file);
      const isAccepted = acceptedTypes.some(type => {
        if (type.includes('*')) {
          return file.type.startsWith(type.replace('*', ''));
        }
        return file.name.toLowerCase().endsWith(type);
      });

      if (!isAccepted) {
        setError(`File type "${file.type}" is not supported.`);
        continue;
      }

      onFileSelect(file);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      case 'text': return <FileText className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: FileUpload['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'uploading': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* File List */}
      <AnimatePresence>
        {uploads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {uploads.map((upload) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
              >
                {/* File Preview */}
                <div className="flex-shrink-0">
                  {upload.preview ? (
                    <img
                      src={upload.preview}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      {getFileIcon(upload.type)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {upload.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(upload.file.size)} • {upload.type}
                  </p>
                  
                  {/* Progress Bar */}
                  {upload.status === 'uploading' && upload.uploadProgress !== undefined && (
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${upload.uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <span className={cn("text-xs capitalize", getStatusColor(upload.status))}>
                    {upload.status}
                  </span>
                  
                  {!disabled && upload.status !== 'uploading' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFile(upload.id)}
                      className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm text-red-600">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="mt-1 h-6 px-2 text-red-600 hover:bg-red-100"
            >
              Dismiss
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop Zone */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200",
          {
            'border-blue-400 bg-blue-50': dragActive,
            'border-gray-300 hover:border-gray-400 hover:bg-gray-50': !dragActive && !disabled,
            'border-gray-200 bg-gray-100 cursor-not-allowed': disabled,
          }
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload className={cn("w-8 h-8 mx-auto mb-3", {
          'text-blue-500': dragActive,
          'text-gray-400': !dragActive,
        })} />
        
        <div className="space-y-1">
          <p className={cn("text-sm", {
            'text-blue-700': dragActive,
            'text-gray-600': !dragActive && !disabled,
            'text-gray-400': disabled,
          })}>
            {dragActive ? 'Drop files here' : 'Drop files here or click to upload'}
          </p>
          
          <p className="text-xs text-gray-500">
            Supports images, audio, and text files up to {formatFileSize(maxFileSize)}
          </p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
