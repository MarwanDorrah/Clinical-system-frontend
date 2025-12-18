import { useEffect, useState, useCallback } from 'react';

export interface UseUnsavedChangesOptions {
  initialValues: Record<string, any>;
  currentValues: Record<string, any>;
  onNavigate?: () => boolean;
}

export function useUnsavedChanges({
  initialValues,
  currentValues,
  onNavigate,
}: UseUnsavedChangesOptions) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const hasChanges = Object.keys(currentValues).some(
      (key) => currentValues[key] !== initialValues[key]
    );
    setHasUnsavedChanges(hasChanges);
  }, [currentValues, initialValues]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const checkUnsavedChanges = useCallback(() => {
    if (!hasUnsavedChanges) return true;

    if (onNavigate) {
      return onNavigate();
    }

    return window.confirm(
      'You have unsaved changes. Are you sure you want to leave? All unsaved data will be lost.'
    );
  }, [hasUnsavedChanges, onNavigate]);

  return {
    hasUnsavedChanges,
    checkUnsavedChanges,
  };
}

export function useFormChanges<T extends Record<string, any>>(initialData: T) {
  const [formData, setFormData] = useState<T>(initialData);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const hasChanges = Object.keys(formData).some(
      (key) => formData[key] !== initialData[key]
    );
    setIsDirty(hasChanges);
  }, [formData, initialData]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setIsDirty(false);
  }, [initialData]);

  return {
    formData,
    setFormData,
    isDirty,
    resetForm,
  };
}
