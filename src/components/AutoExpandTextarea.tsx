'use client';

import { useState, useRef, useEffect } from 'react';

interface AutoExpandTextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  rows?: number;
  helpText?: string;
  error?: string;
  templates?: Array<{ label: string; value: string }>;
}

export default function AutoExpandTextarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  minLength,
  maxLength,
  rows = 3,
  helpText,
  error,
  templates,
}: AutoExpandTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [characterCount, setCharacterCount] = useState(value?.length || 0);

  useEffect(() => {
    adjustHeight();
    setCharacterCount(value?.length || 0);
  }, [value]);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
    adjustHeight();
    setCharacterCount(e.target.value.length);
  };

  const handleTemplateSelect = (template: string) => {
    const syntheticEvent = {
      target: {
        name,
        value: template,
      },
    } as React.ChangeEvent<HTMLTextAreaElement>;
    onChange(syntheticEvent);
    setShowTemplates(false);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {templates && templates.length > 0 && (
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            {showTemplates ? 'Hide' : 'Show'} Templates
          </button>
        )}
      </div>

      {helpText && (
        <p className="text-xs text-gray-500 mb-2">{helpText}</p>
      )}

      {showTemplates && templates && (
        <div className="mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Quick Templates:</p>
          <div className="space-y-1">
            {templates.map((template, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleTemplateSelect(template.value)}
                className="block w-full text-left px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded transition"
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <textarea
        ref={textareaRef}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        rows={rows}
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition resize-none ${
          error
            ? 'border-red-300 focus:ring-red-500'
            : 'border-gray-300 focus:ring-primary-500'
        }`}
      />

      <div className="flex justify-between items-center mt-1">
        {error && <p className="text-xs text-red-500">{error}</p>}
        {!error && minLength && characterCount < minLength && (
          <p className="text-xs text-gray-500">
            Minimum {minLength} characters (current: {characterCount})
          </p>
        )}
        {!error && !minLength && <div />}
        {maxLength && (
          <p className={`text-xs ${
            characterCount > maxLength * 0.9 ? 'text-orange-500' : 'text-gray-500'
          }`}>
            {characterCount} / {maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
