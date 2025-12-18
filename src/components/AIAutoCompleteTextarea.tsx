import React, { useState, useRef, useEffect } from 'react';
import { useAIAutocomplete } from '@/hooks/useAIAutocomplete';

interface AIAutoCompleteTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  context?: string;
  disabled?: boolean;
  label?: string;
  minChars?: number;
  debounceMs?: number;
  showAIBadge?: boolean;
}

export const AIAutoCompleteTextarea: React.FC<AIAutoCompleteTextareaProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  rows = 4,
  context = '',
  disabled = false,
  label,
  minChars = 10,
  debounceMs = 500,
  showAIBadge = true,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [justApplied, setJustApplied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { suggestions, isLoading, getSuggestions, clearSuggestions } = useAIAutocomplete({
    context,
    minChars,
    debounceMs,
    onError: (error) => {
      console.warn('AI autocomplete unavailable:', error.message);
      
    },
  });

  useEffect(() => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  }, [suggestions]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (newValue.length >= minChars) {
      getSuggestions(newValue);
    } else {
      clearSuggestions();
      setShowSuggestions(false);
    }
  };

  const applySuggestion = (suggestion: string, mode: 'insert' | 'replace' = 'insert') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const suggestionText = suggestion.trim();
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);

    if (mode === 'insert') {
      
      const needsSpaceBefore = textBeforeCursor.length > 0 && 
                               !textBeforeCursor.endsWith(' ') && 
                               !textBeforeCursor.endsWith('\n');
      const needsSpaceAfter = textAfterCursor.length > 0 && 
                              !textAfterCursor.startsWith(' ') && 
                              !textAfterCursor.startsWith('\n');
      
      const spaceBefore = needsSpaceBefore ? ' ' : '';
      const spaceAfter = needsSpaceAfter ? ' ' : '';
      const newText = textBeforeCursor + spaceBefore + suggestionText + spaceAfter + textAfterCursor;
      const newCursorPos = (textBeforeCursor + spaceBefore + suggestionText + spaceAfter).length;
      
      onChange(newText);

      setTimeout(() => {
        textarea.selectionStart = newCursorPos;
        textarea.selectionEnd = newCursorPos;
      }, 0);
    } else {
      
      const lines = value.split('\n');
      const textBeforeCursorLines = textBeforeCursor.split('\n');
      const currentLineIndex = textBeforeCursorLines.length - 1;

      lines[currentLineIndex] = suggestionText;
      const newText = lines.join('\n');
      
      onChange(newText);

      setTimeout(() => {
        const newCursorPos = lines.slice(0, currentLineIndex).join('\n').length + 
                            (currentLineIndex > 0 ? 1 : 0) + suggestionText.length;
        textarea.selectionStart = newCursorPos;
        textarea.selectionEnd = newCursorPos;
      }, 0);
    }

    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 1500);
    
    setShowSuggestions(false);
    clearSuggestions();
    textarea.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Tab':
        
        e.preventDefault();
        applySuggestion(suggestions[selectedIndex], 'insert');
        break;
      case 'Alt':
        
        e.preventDefault();
        applySuggestion(suggestions[selectedIndex], 'replace');
        break;
      case 'Enter':
        
        if (e.ctrlKey) {
          e.preventDefault();
          applySuggestion(suggestions[selectedIndex], 'insert');
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        clearSuggestions();
        break;
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && suggestionsRef.current?.contains(relatedTarget)) {
      return; 
    }

    setTimeout(() => {
      setShowSuggestions(false);
      clearSuggestions();
    }, 150);
  };

  const handleFocus = () => {
    
    if (suggestions.length > 0 && value.length >= minChars) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative">
      {label && (
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
          {label}
          {showAIBadge && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 7H7v6h6V7z"/>
                <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd"/>
              </svg>
              AI Powered
            </span>
          )}
        </label>
      )}
      
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          spellCheck={true}
          className={`w-full px-3 py-2 pr-12 border rounded-md shadow-sm transition-all ${
            showSuggestions 
              ? 'border-blue-400 ring-2 ring-blue-200' 
              : 'border-gray-300 focus:border-blue-500'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
        />
        
        {}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-200 rounded-md shadow-sm">
              <svg className="animate-spin h-3.5 w-3.5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs font-medium text-blue-700">AI</span>
            </div>
          )}
          
          {justApplied && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-200 rounded-md shadow-sm animate-fade-in">
              <svg className="h-3.5 w-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-xs font-medium text-green-700">Applied</span>
            </div>
          )}
          
          {showSuggestions && suggestions.length > 0 && !isLoading && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 border border-purple-200 rounded-md shadow-sm">
              <svg className="h-3.5 w-3.5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              <span className="text-xs font-medium text-purple-700">{suggestions.length}</span>
            </div>
          )}
        </div>

        {}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            onMouseDown={(e) => e.preventDefault()}
            className="absolute z-50 w-full top-full mt-2 bg-white border border-blue-300 rounded-lg shadow-2xl max-h-72 overflow-hidden animate-slide-down"
          >
            {}
            <div className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 7H7v6h6V7z"/>
                    <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-sm font-semibold">AI Suggestions</span>
                  <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs font-medium">{suggestions.length}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSuggestions(false);
                    clearSuggestions();
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {}
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs">
              <div className="flex items-center justify-center gap-4 text-gray-600">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded shadow-sm font-mono font-semibold">Tab</kbd>
                  <span>Insert</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded shadow-sm font-mono font-semibold">Alt</kbd>
                  <span>Replace</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded shadow-sm font-mono font-semibold">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded shadow-sm font-mono font-semibold">Esc</kbd>
                  <span>Close</span>
                </div>
              </div>
            </div>

            {}
            <div className="max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => {
                const isCompletion = suggestion.trim().toLowerCase().startsWith(value.trim().toLowerCase());
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applySuggestion(suggestion, 'insert')}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left px-4 py-3 text-sm border-b border-gray-100 last:border-0 transition-all ${
                      index === selectedIndex 
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-l-blue-500 shadow-sm' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {}
                      <div className={`flex-shrink-0 mt-0.5 px-2 py-1 rounded-md text-xs font-semibold ${
                        isCompletion 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {isCompletion ? (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                            </svg>
                            Tab
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                            </svg>
                            Alt
                          </span>
                        )}
                      </div>
                      
                      {}
                      <span className="flex-1 leading-relaxed">{suggestion}</span>
                      
                      {}
                      {index === selectedIndex && (
                        <svg className="flex-shrink-0 w-4 h-4 text-blue-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
