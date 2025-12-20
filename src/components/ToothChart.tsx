'use client';

import { useState } from 'react';
import { ToothRecord } from '@/types/api.types';

interface ToothChartProps {
  selectedTeeth: ToothRecord[];
  onToothClick: (toothNumber: number) => void;
  notation?: 'universal' | 'fdi';
  readonly?: boolean;
}

type ToothCondition = 'healthy' | 'problem' | 'treated' | 'missing' | 'others';

export const TOOTH_CONDITIONS = {
  HEALTHY: 'Healthy',
  CARIES: 'Caries',
  FILLING: 'Filling',
  ROOT_CANAL: 'Root Canal',
  CROWN: 'Crown',
  EXTRACTION: 'Extraction',
  MISSING: 'Missing',
  DECAY: 'Decay',
  OTHERS: 'Others',
} as const;

export const CONDITION_TO_COLOR_MAP: Record<string, ToothCondition> = {
  [TOOTH_CONDITIONS.HEALTHY]: 'healthy',
  [TOOTH_CONDITIONS.CARIES]: 'problem',
  [TOOTH_CONDITIONS.DECAY]: 'problem',
  [TOOTH_CONDITIONS.FILLING]: 'treated',
  [TOOTH_CONDITIONS.ROOT_CANAL]: 'treated',
  [TOOTH_CONDITIONS.CROWN]: 'treated',
  [TOOTH_CONDITIONS.EXTRACTION]: 'missing',
  [TOOTH_CONDITIONS.MISSING]: 'missing',
};

export const TOOTH_NAMES: Record<number, string> = {
  // Upper Right 
  18: 'Third Molar',
  17: 'Second Molar',
  16: 'First Molar',
  15: 'Second Bicuspid',
  14: 'First Bicuspid',
  13: 'Cuspid',
  12: 'Lateral Incisor',
  11: 'Central Incisor',

  // Upper Left 
  21: 'Central Incisor',
  22: 'Lateral Incisor',
  23: 'Cuspid',
  24: 'First Bicuspid',
  25: 'Second Bicuspid',
  26: 'First Molar',
  27: 'Second Molar',
  28: 'Third Molar',

  // Lower Left 
  31: 'Central Incisor',
  32: 'Lateral Incisor',
  33: 'Cuspid',
  34: 'First Bicuspid',
  35: 'Second Bicuspid',
  36: 'First Molar',
  37: 'Second Molar',
  38: 'Third Molar',

  // Lower Right 
  48: 'Third Molar',
  47: 'Second Molar',
  46: 'First Molar',
  45: 'Second Bicuspid',
  44: 'First Bicuspid',
  43: 'Cuspid',
  42: 'Lateral Incisor',
  41: 'Central Incisor',
};


export default function ToothChart({
  selectedTeeth,
  onToothClick,
  notation = 'fdi',
  readonly = false,
}: ToothChartProps) {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);

  const upperRight = [18,17,16,15,14,13,12,11];
  const upperLeft = [21,22,23,24,25,26,27,28];
  const lowerLeft = [31,32,33,34,35,36,37,38];
  const lowerRight = [48,47,46,45,44,43,42,41];

  

  // Get tooth condition from selected teeth
  // Uses exact string matching against standardized conditions for accurate color mapping
  const getToothCondition = (toothNumber: number): ToothCondition => {
    const tooth = selectedTeeth.find((t) => (t.ToothNumber || t.toothNumber) === toothNumber);
    if (!tooth) return 'healthy';
    
    const condition = (tooth.Condition || tooth.condition || '').trim();
    
    // Use exact mapping for standard conditions
    if (CONDITION_TO_COLOR_MAP[condition]) {
      return CONDITION_TO_COLOR_MAP[condition];
    }
    
    // Empty or exactly "Healthy" defaults to healthy
    if (condition === '' || condition === TOOTH_CONDITIONS.HEALTHY) {
      return 'healthy';
    }
    
    // All other custom conditions map to 'others'
    return 'others';
  };

  const getToothColor = (condition: ToothCondition, isHovered: boolean) => {
    const colors = {
      healthy: isHovered ? 'bg-green-200 border-green-400' : 'bg-green-100 border-green-300',
      problem: isHovered ? 'bg-red-200 border-red-400' : 'bg-red-100 border-red-300',
      treated: isHovered ? 'bg-yellow-200 border-yellow-400' : 'bg-yellow-100 border-yellow-300',
      missing: isHovered ? 'bg-gray-300 border-gray-500' : 'bg-gray-200 border-gray-400',
      others: isHovered ? 'bg-purple-200 border-purple-400' : 'bg-purple-100 border-purple-300',
    };
    return colors[condition];
  };

  const renderTooth = (toothNumber: number) => {
    const condition = getToothCondition(toothNumber);
    const isHovered = hoveredTooth === toothNumber;
    const isSelected = selectedTeeth.some((t) => (t.ToothNumber || t.toothNumber) === toothNumber);
    const tooth = selectedTeeth.find((t) => (t.ToothNumber || t.toothNumber) === toothNumber);
    
    const toothLabel = TOOTH_NAMES[toothNumber] || '';

    return (
      <button
        key={toothNumber}
        type="button"
        onClick={() => !readonly && onToothClick(toothNumber)}
        onMouseEnter={() => setHoveredTooth(toothNumber)}
        onMouseLeave={() => setHoveredTooth(null)}
        disabled={readonly}
        className={
          `tooth-btn relative border-2 rounded-lg transition-all box-border min-w-[48px] ` +
          `${getToothColor(condition, isHovered)} ` +
          `${isSelected ? 'ring-2 ring-primary-500 ring-offset-0' : ''} ` +
          `${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-105'} ` +
          `flex flex-col items-center justify-center text-center p-1 ` +
          `w-12 sm:w-14 md:w-16 h-12 sm:h-16 md:h-20 ` +
          `${condition === 'missing' ? 'opacity-50' : ''}`
        }
        title={tooth ? `${tooth.Condition || tooth.condition || 'Normal'} — ${toothLabel}` : toothLabel}
      >
        <span className={`text-xs font-bold ${condition === 'missing' ? 'text-gray-500' : 'text-gray-700'}`}>
          #{toothNumber}
        </span>
        <span className={`text-[10px] font-medium mt-0.5 ${condition === 'missing' ? 'text-gray-500' : 'text-gray-700'}`}>
          {toothLabel.length > 12 ? `${toothLabel.substring(0, 12)}...` : toothLabel}
        </span>
        {tooth?.Condition || tooth?.condition ? (
          <span className={`text-[10px] block text-gray-600`}>{((tooth.Condition || tooth.condition) || '').trim()}</span>
        ) : (
          <span className="text-[10px] text-green-600 font-medium mt-0.5">OK</span>
        )}
        {condition === 'missing' && (
          <span className="text-[10px] text-gray-500 font-bold">X</span>
        )}
        {isHovered && !readonly && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
            Tooth #{toothNumber}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <style jsx>{`
        @media print {
          .tooth-row { flex-wrap: wrap !important; gap: 6px !important; }
          .tooth-btn { display: inline-block !important; width: 11% !important; min-width: 40px !important; height: auto !important; }
          .tooth-btn span { font-size: 10px !important; }
        }
      `}</style>
      <div className="space-y-8">
        {/* Upper Teeth */}
        <div>
          <div className="text-center mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">Upper</span>
          </div>
          <div className="grid grid-cols-2 gap-8">
            {/* Upper Right */}
            <div>
              <div className="text-center mb-2">
                <span className="text-xs text-gray-400">Right</span>
              </div>
                  <div className="px-2">
                    <div className="flex flex-nowrap justify-end items-start gap-3 tooth-row">
                      {upperRight.map(renderTooth)}
                    </div>
                  </div>
            </div>
            {/* Upper Left */}
            <div>
              <div className="text-center mb-2">
                <span className="text-xs text-gray-400">Left</span>
              </div>
              <div className="px-2">
                <div className="flex flex-nowrap justify-start items-start gap-3 tooth-row">
                  {upperLeft.map(renderTooth)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Centerline */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-dashed border-gray-300"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-xs font-semibold text-gray-500">
              CENTERLINE
            </span>
          </div>
        </div>

        {/* Lower Teeth */}
        <div>
          <div className="grid grid-cols-2 gap-8">
            {/* Lower Right */}
            <div>
              <div className="px-2">
                <div className="flex flex-nowrap justify-end items-start gap-3 tooth-row">
                  {lowerRight.map(renderTooth)}
                </div>
              </div>
              <div className="text-center mt-2">
                <span className="text-xs text-gray-400">Right</span>
              </div>
            </div>
            {/* Lower Left */}
            <div>
              <div className="px-2">
                <div className="flex flex-nowrap justify-start items-start gap-3 tooth-row">
                  {lowerLeft.map(renderTooth)}
                </div>
              </div>
              <div className="text-center mt-2">
                <span className="text-xs text-gray-400">Left</span>
              </div>
            </div>
          </div>
          <div className="text-center mt-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">Lower</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-3">Color Legend:</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-green-100 border-2 border-green-300 rounded shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700">Healthy</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-yellow-100 border-2 border-yellow-300 rounded shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700">Treated (Filling/Root Canal/Crown)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-red-100 border-2 border-red-300 rounded shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700">Problem (Caries/Decay)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gray-200 border-2 border-gray-400 rounded shadow-sm opacity-50"></div>
            <span className="text-sm font-medium text-gray-700">Missing/Extracted</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-purple-100 border-2 border-purple-300 rounded shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700">Others (Custom)</span>
          </div>
        </div>
      </div>

      {!readonly && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Click a tooth to add it to records below. Click again to remove it from records.
          </p>
        </div>
      )}
    </div>
  );
}
