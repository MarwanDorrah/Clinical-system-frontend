'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  existingImages?: string[];
  onRemoveExisting?: (imagePath: string) => void;
  onChange?: (files: File[]) => void;
}

interface SelectedFile {
  file: File;
  preview: string;
  error?: string;
}

export default function ImageUpload({
  maxFiles = 5,
  maxSizeMB = 10,
  accept = 'image/*',
  existingImages = [],
  onRemoveExisting,
  onChange,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'File must be an image';
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Check max files limit
    if (selectedFiles.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate and prepare files
    const newFiles: SelectedFile[] = fileArray.map(file => {
      const error = validateFile(file);
      return {
        file,
        preview: URL.createObjectURL(file),
        error: error || undefined,
      };
    });

    const updatedFiles = [...selectedFiles, ...newFiles];
    setSelectedFiles(updatedFiles);
    
    // Notify parent of valid files
    if (onChange) {
      const validFiles = updatedFiles.filter(f => !f.error).map(f => f.file);
      onChange(validFiles);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      
      // Notify parent
      if (onChange) {
        const validFiles = updated.filter(f => !f.error).map(f => f.file);
        onChange(validFiles);
      }
      
      return updated;
    });
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragging 
            ? 'border-primary-500 bg-primary-50 scale-[1.02]' 
            : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-25'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center
              ${isDragging ? 'bg-primary-100' : 'bg-gray-200'}
            `}>
              <Upload className={`w-8 h-8 ${isDragging ? 'text-primary-600' : 'text-gray-500'}`} />
            </div>
          </div>

          {/* Text */}
          <div>
            <p className="text-lg font-semibold text-gray-900 mb-1">
              {isDragging ? 'Drop images here' : 'Drag & drop images here'}
            </p>
            <p className="text-sm text-gray-600">
              or{' '}
              <button
                type="button"
                onClick={handleBrowseClick}
                className="text-primary-600 font-medium hover:text-primary-700 underline"
              >
                browse files
              </button>
            </p>
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500">
            <p>Maximum {maxFiles} files • Up to {maxSizeMB}MB each</p>
            <p>Supported formats: JPG, PNG, GIF, WebP</p>
          </div>
        </div>
      </div>

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Existing Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {existingImages.map((imagePath, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-100">
                  <img
                    src={imagePath}
                    alt={`Existing image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {onRemoveExisting && (
                  <button
                    type="button"
                    onClick={() => onRemoveExisting(imagePath)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs truncate">{imagePath.split('/').pop()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Selected Images ({selectedFiles.length}/{maxFiles})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-100">
                  <img
                    src={file.preview}
                    alt={file.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeSelectedFile(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* File Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs font-medium truncate">
                    {file.file.name}
                  </p>
                  <p className="text-white/80 text-[10px]">
                    {(file.file.size / 1024).toFixed(1)} KB
                  </p>
                  {file.error && (
                    <p className="text-red-300 text-[10px] mt-1">{file.error}</p>
                  )}
                </div>

                {/* Error Badge */}
                {file.error && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full">
                    Invalid
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
