import React from 'react';
import Modal from '@/components/Modal';
import { Supply } from '@/types/api.types';
import { Package, Info } from 'lucide-react';
import Button from './Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  supply: Supply | null;
}

export default function SupplyDetailsModal({ isOpen, onClose, supply }: Props) {
  if (!supply) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Supply #${supply.supply_ID}`} size="md">
      <div className="space-y-4 text-sm">
        <div className="flex items-start gap-4">
          <Package className="w-6 h-6 text-primary-600" />
          <div>
            <h3 className="font-semibold text-gray-900">{supply.supply_Name}</h3>
            <p className="text-gray-600">ID: <span className="font-mono">{supply.supply_ID}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Category</p>
            <p className="text-gray-800">{supply.category}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Unit</p>
            <p className="text-gray-800">{supply.unit}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Quantity</p>
            <p className="text-gray-800">{supply.quantity}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <p className="text-gray-800">{supply.quantity === 0 ? 'Out of stock' : supply.quantity <= 10 ? 'Low stock' : 'In stock'}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500">Description</p>
          <p className="text-gray-800 whitespace-pre-wrap">{supply.description || '—'}</p>
        </div>

        <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
