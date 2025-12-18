'use client';

import { useState, useEffect, useRef } from 'react';
import { Appointment, Patient } from '@/types/api.types';
import { Search, Calendar, User, Hash, X } from 'lucide-react';

interface AppointmentSearchAutocompleteProps {
  appointments: Appointment[];
  patients: Patient[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface SearchSuggestion {
  type: 'ref' | 'id' | 'patient';
  value: string;
  label: string;
  appointmentId?: number;
  patientId?: number;
}

export default function AppointmentSearchAutocomplete({
  appointments,
  patients,
  value,
  onChange,
  placeholder = 'Search appointments...',
}: AppointmentSearchAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!value || value.trim().length === 0) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const query = value.trim().toLowerCase();
    const newSuggestions: SearchSuggestion[] = [];

    appointments.forEach((apt) => {
      const ref = (apt.ref_Num || '').toString().toLowerCase();
      if (ref.includes(query)) {
        newSuggestions.push({
          type: 'ref',
          value: apt.ref_Num || '',
          label: `Ref: ${apt.ref_Num} - ${apt.type}`,
          appointmentId: apt.appointment_ID,
        });
      }
    });

    appointments.forEach((apt) => {
      const id = apt.appointment_ID?.toString() || '';
      if (id.includes(query)) {
        newSuggestions.push({
          type: 'id',
          value: id,
          label: `ID: ${id} - ${apt.type}`,
          appointmentId: apt.appointment_ID,
        });
      }
    });

    if (/[a-zA-Z]/.test(query)) {
      const patientMatches = new Map<number, Patient>();
      
      patients.forEach((patient) => {
        const fullName = `${patient.first || ''} ${patient.middle || ''} ${patient.last || ''}`.toLowerCase();
        const firstName = (patient.first || '').toLowerCase();
        const lastName = (patient.last || '').toLowerCase();
        
        if (fullName.includes(query) || firstName.includes(query) || lastName.includes(query)) {
          patientMatches.set(patient.patient_ID, patient);
        }
      });

      patientMatches.forEach((patient) => {
        const patientAppointments = appointments.filter(
          (apt) => apt.patient_ID === patient.patient_ID
        );
        
        if (patientAppointments.length > 0) {
          newSuggestions.push({
            type: 'patient',
            value: `${patient.first} ${patient.last}`,
            label: `${patient.first} ${patient.middle || ''} ${patient.last} (${patientAppointments.length} appointments)`,
            patientId: patient.patient_ID,
          });
        }
      });
    }

    const uniqueSuggestions = newSuggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex((s) => s.label === suggestion.label)
      )
      .slice(0, 8);

    setSuggestions(uniqueSuggestions);
    setIsOpen(uniqueSuggestions.length > 0);
    setSelectedIndex(-1);
  }, [value, appointments, patients]);

  const handleSelect = (suggestion: SearchSuggestion) => {
    onChange(suggestion.value);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ref':
        return <Hash className="w-4 h-4 text-purple-500" />;
      case 'id':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'patient':
        return <User className="w-4 h-4 text-green-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ref':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'id':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'patient':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => value.trim() && suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
          autoComplete="off"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Suggestions ({suggestions.length})
            </div>
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${index}`}
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full text-left px-3 py-3 rounded-lg transition-all duration-150 ${
                  selectedIndex === index
                    ? 'bg-primary-50 border-2 border-primary-300 shadow-md'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border ${getTypeColor(suggestion.type)}`}>
                    {getIcon(suggestion.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {suggestion.type === 'ref' && 'Reference Number'}
                      {suggestion.type === 'id' && 'Appointment ID'}
                      {suggestion.type === 'patient' && 'Patient Name'}
                    </p>
                  </div>
                  {selectedIndex === index && (
                    <div className="flex-shrink-0">
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded">
                        ↵
                      </kbd>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 rounded-b-xl">
            <p className="text-xs text-gray-500 text-center">
              Use ↑↓ to navigate • Enter to select • Esc to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
