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

export default function ToothChart({
  selectedTeeth,
  onToothClick,
  notation = 'universal',
  readonly = false,
}: ToothChartProps) {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);

  // Universal numbering: 1-32 (US system)
  const upperRight = [1, 2, 3, 4, 5, 6, 7, 8];
  const upperLeft = [9, 10, 11, 12, 13, 14, 15, 16];
  const lowerLeft = [17, 18, 19, 20, 21, 22, 23, 24];
  const lowerRight = [25, 26, 27, 28, 29, 30, 31, 32];

  // Get tooth condition from selected teeth
  const getToothCondition = (toothNumber: number): ToothCondition => {
    const tooth = selectedTeeth.find((t) => (t.ToothNumber || t.toothNumber) === toothNumber);
    if (!tooth) return 'healthy';
    
    const condition = (tooth.Condition || tooth.condition || '').toLowerCase();
    if (condition.includes('missing') || condition.includes('extracted') || condition.includes('extraction')) return 'missing';
    if (condition.includes('cavity') || condition.includes('decay') || condition.includes('caries') || condition.includes('problem')) return 'problem';
    if (condition.includes('treated') || condition.includes('filled') || condition.includes('filling') || condition.includes('crown') || condition.includes('root canal')) return 'treated';
    
    // If it's one of the standard options, return healthy; otherwise return others
    if (condition === '' || condition.includes('healthy')) return 'healthy';
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
    
    return (
      <button
        key={toothNumber}
        type="button"
        onClick={() => !readonly && onToothClick(toothNumber)}
        onMouseEnter={() => setHoveredTooth(toothNumber)}
        onMouseLeave={() => setHoveredTooth(null)}
        disabled={readonly}
        className={`
          relative w-16 h-20 border-2 rounded-lg transition-all
          ${getToothColor(condition, isHovered)}
          ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''}
          ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-105'}
          flex flex-col items-center justify-center text-center p-1
          ${condition === 'missing' ? 'opacity-50' : ''}
        `}
        title={tooth ? `${tooth.Condition || tooth.condition || 'Normal'}` : ''}
      >
        <span className={`text-xs font-bold ${condition === 'missing' ? 'text-gray-500' : 'text-gray-700'}`}>
          #{toothNumber}
        </span>
        {tooth?.Condition || tooth?.condition ? (
          <span className={`text-[10px] font-medium mt-0.5 ${condition === 'missing' ? 'text-gray-500' : 'text-gray-700'}`}>
            {((tooth.Condition || tooth.condition) || '').substring(0, 8)}
          </span>
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
              <div className="flex justify-end space-x-2">
                {upperRight.map(renderTooth)}
              </div>
            </div>
            {/* Upper Left */}
            <div>
              <div className="text-center mb-2">
                <span className="text-xs text-gray-400">Left</span>
              </div>
              <div className="flex justify-start space-x-2">
                {upperLeft.map(renderTooth)}
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
              <div className="flex justify-end space-x-2">
                {lowerRight.map(renderTooth)}
              </div>
              <div className="text-center mt-2">
                <span className="text-xs text-gray-400">Right</span>
              </div>
            </div>
            {/* Lower Left */}
            <div>
              <div className="flex justify-start space-x-2">
                {lowerLeft.map(renderTooth)}
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
            <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
            <span className="text-sm text-gray-600">Healthy</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
            <span className="text-sm text-gray-600">Treated</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
            <span className="text-sm text-gray-600">Problem/Cavity</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-200 border-2 border-gray-400 rounded opacity-50"></div>
            <span className="text-sm text-gray-600">Missing</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-100 border-2 border-purple-300 rounded"></div>
            <span className="text-sm text-gray-600">Others</span>
          </div>
        </div>
      </div>

      {!readonly && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">Click on teeth to select and add details</p>
        </div>
      )}
    </div>
  );
}
