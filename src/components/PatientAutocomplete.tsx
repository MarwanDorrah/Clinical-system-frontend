'use client';

import { useState, useEffect, useRef } from 'react';
import { Patient } from '@/types/api.types';
import { patientService } from '@/services';
import { Search, User, X, Loader2 } from 'lucide-react';

interface PatientAutocompleteProps {
  value: Patient | null;
  onChange: (patient: Patient | null) => void;
  placeholder?: string;
  showLastVisit?: boolean;
  disabled?: boolean;
}

export default function PatientAutocomplete({
  value,
  onChange,
  placeholder = 'Search patient by name or phone...',
  showLastVisit = false,
  disabled = false,
}: PatientAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load all patients on mount
  useEffect(() => {
    loadPatients();
  }, []);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter patients when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPatients([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = patients.filter((patient) => {
      const fullName = `${patient.first} ${patient.middle || ''} ${patient.last}`.toLowerCase();
      const phone = (patient.phone || '').toLowerCase();
      return fullName.includes(query) || phone.includes(query);
    });

    setFilteredPatients(filtered.slice(0, 10)); // Limit to 10 results
    setSelectedIndex(0);
  }, [searchQuery, patients]);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const data = await patientService.getAllPatients() as Patient[];
      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading patients:', error);
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (patient: Patient) => {
    onChange(patient);
    setSearchQuery('');
    setIsOpen(false);
    setFilteredPatients([]);
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery('');
    setFilteredPatients([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredPatients.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredPatients.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredPatients.length) % filteredPatients.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredPatients[selectedIndex]) {
          handleSelect(filteredPatients[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFilteredPatients([]);
        break;
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Display selected patient */}
      {value ? (
        <div className="border-2 border-primary-500 rounded-lg p-4 bg-primary-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-600 rounded-full p-2">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {value.first} {value.middle && `${value.middle} `}{value.last}
                </p>
                <p className="text-sm text-gray-600">
                  {value.gender} • {calculateAge(value.dob)} years • {value.phone}
                </p>
                {showLastVisit && (
                  <p className="text-xs text-gray-500 mt-1">Patient ID: #{value.patient_ID}</p>
                )}
              </div>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Clear selection"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Search input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {isLoading && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            )}
          </div>

          {/* Dropdown results */}
          {isOpen && filteredPatients.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
              {filteredPatients.map((patient, index) => (
                <button
                  key={patient.patient_ID}
                  type="button"
                  onClick={() => handleSelect(patient)}
                  className={`w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                    index === selectedIndex ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-100 rounded-full p-2">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {patient.first} {patient.middle && `${patient.middle} `}{patient.last}
                      </p>
                      <p className="text-sm text-gray-600">
                        {patient.gender} • {calculateAge(patient.dob)} yrs • {patient.phone}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: #{patient.patient_ID}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results message */}
          {isOpen && searchQuery && filteredPatients.length === 0 && !isLoading && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-4">
              <p className="text-center text-gray-500">No patients found matching "{searchQuery}"</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
