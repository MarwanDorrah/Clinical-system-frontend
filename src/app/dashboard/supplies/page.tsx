'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Alert from '@/components/Alert';
import SearchBar from '@/components/SearchBar';
import Badge from '@/components/Badge';
import Tabs from '@/components/Tabs';
import ConfirmDialog from '@/components/ConfirmDialog';
import { supplyService, stockTransactionService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { Supply, StockTransaction, ApiError } from '@/types/api.types';
import { getCurrentDateForAPI, getCurrentTimeForAPI, timeInputToAPI, formatDateForDisplay } from '@/utils/date.utils';
import { Package, AlertTriangle, TrendingDown, History, Plus, ChevronRight, Eye } from 'lucide-react';
import SupplyDetailsModal from '@/components/SupplyDetailsModal';
import { AIAutoCompleteTextarea } from '@/components/AIAutoCompleteTextarea';

export default function SuppliesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDoctor, userId } = useAuth();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [filteredSupplies, setFilteredSupplies] = useState<Supply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: number | null;
    name: string;
  }>({ isOpen: false, id: null, name: '' });
  const [formData, setFormData] = useState({
    supply_Name: '',
    category: '',
    unit: '',
    quantity: '',
    description: '',
  });
  const [transactionData, setTransactionData] = useState({
    quantity: '',
    date: getCurrentDateForAPI(),
    time: getCurrentTimeForAPI().substring(0, 5), 
  });

  useEffect(() => {
    if (!isDoctor()) {
      router.push('/dashboard');
      return;
    }
    fetchSupplies();
    
    const action = searchParams.get('action');
    if (action === 'add') {
      setIsModalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      fetchSupplies();
    }
  }, [categoryFilter, stockFilter]);

  const fetchSupplies = async () => {
    try {
      setIsLoading(true);
      let data: Supply[];
      
      if (categoryFilter !== 'all') {
        data = await supplyService.getByCategory(categoryFilter) as Supply[];
      } else if (stockFilter === 'low') {
        data = await supplyService.getLowStock(10) as Supply[];
      } else {
        data = await supplyService.getAllSupplies() as Supply[];
      }
      
      setSupplies(data);
      setFilteredSupplies(data);
    } catch (error) {
      console.error('Error fetching supplies:', error);
      showAlert('error', 'Failed to load supplies');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    filterSupplies();
  }, [supplies, searchQuery, categoryFilter, stockFilter]);

  const filterSupplies = () => {
    let filtered = [...supplies];

    if (searchQuery) {
      filtered = filtered.filter(supply =>
        supply.supply_Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supply.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(supply => supply.category === categoryFilter);
    }

    if (stockFilter === 'low') {
      filtered = filtered.filter(supply => supply.quantity > 0 && supply.quantity <= 10);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(supply => supply.quantity === 0);
    }

    setFilteredSupplies(filtered);
  };

  const getStockStatus = (quantity: number): { label: string; variant: 'success' | 'warning' | 'danger' } => {
    if (quantity === 0) return { label: 'Out of Stock', variant: 'danger' };
    if (quantity <= 10) return { label: 'Low Stock', variant: 'warning' };
    return { label: 'In Stock', variant: 'success' };
  };

  const getUniqueCategories = () => {
    const categories = supplies.map(s => s.category).filter((v, i, a) => a.indexOf(v) === i);
    return categories;
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleOpenModal = (supply?: Supply) => {
    if (supply) {
      setEditingSupply(supply);
      setFormData({
        supply_Name: supply.supply_Name,
        category: supply.category,
        unit: supply.unit,
        quantity: supply.quantity.toString(),
        description: supply.description || '',
      });
    } else {
      setEditingSupply(null);
      setFormData({
        supply_Name: '',
        category: '',
        unit: '',
        quantity: '',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenTransactionModal = (supply: Supply) => {
    setSelectedSupply(supply);
    setTransactionData({
      quantity: '',
      date: getCurrentDateForAPI(),
      time: getCurrentTimeForAPI().substring(0, 5), 
    });
    setIsTransactionModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupply(null);
  };

  const handleCloseTransactionModal = () => {
    setIsTransactionModalOpen(false);
    setSelectedSupply(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTransactionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTransactionData({ ...transactionData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSupply) {
        const submitData = {
          supply_ID: editingSupply.supply_ID,
          supply_Name: formData.supply_Name,
          category: formData.category,
          unit: formData.unit,
          quantity: parseInt(formData.quantity),
          description: formData.description,
        };
        console.log('Updating supply:', editingSupply.supply_ID, submitData);
        await supplyService.updateSupply(editingSupply.supply_ID, submitData);
        showAlert('success', 'Supply updated successfully');
      } else {
        const submitData = {
          supply_Name: formData.supply_Name,
          category: formData.category,
          unit: formData.unit,
          quantity: parseInt(formData.quantity),
          description: formData.description,
        };
        console.log('Creating supply:', submitData);
        await supplyService.createSupply(submitData);
        showAlert('success', 'Supply created successfully');
      }
      handleCloseModal();
      fetchSupplies();
    } catch (error) {
      console.error('Error submitting supply:', error);
      const apiError = error as ApiError;
      showAlert('error', apiError.error || 'Operation failed');
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupply || !userId) return;

    const quantityToUse = parseInt(transactionData.quantity);
    
    if (quantityToUse <= 0) {
      showAlert('error', 'Quantity must be greater than 0');
      return;
    }
    
    if (quantityToUse > selectedSupply.quantity) {
      showAlert('error', `Cannot use ${quantityToUse} ${selectedSupply.unit}. Only ${selectedSupply.quantity} ${selectedSupply.unit} available.`);
      return;
    }

    try {
      await stockTransactionService.createTransaction({
        supply_ID: selectedSupply.supply_ID,
        doctor_ID: parseInt(userId),
        date: transactionData.date,
        time: timeInputToAPI(transactionData.time),
        quantity: quantityToUse,
      });
      showAlert('success', 'Stock transaction created successfully');
      handleCloseTransactionModal();
      fetchSupplies();
    } catch (error) {
      const apiError = error as ApiError;
      showAlert('error', apiError.error || 'Transaction failed');
    }
  };

  const handleDelete = async (supply: Supply) => {
    setDeleteConfirm({
      isOpen: true,
      id: supply.supply_ID,
      name: supply.supply_Name,
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    
    try {
      console.log('Deleting supply:', deleteConfirm.id);
      await supplyService.deleteSupply(deleteConfirm.id);
      showAlert('success', 'Supply deleted successfully');
      fetchSupplies();
    } catch (error) {
      console.error('Error deleting supply:', error);
      const apiError = error as ApiError;
      showAlert('error', apiError.error || 'Delete failed');
    } finally {
      setDeleteConfirm({ isOpen: false, id: null, name: '' });
    }
  };

  const columns = [
    { 
      key: 'supply_ID', 
      header: 'ID',
      render: (supply: Supply) => (
        <span className="font-mono text-sm text-gray-500">#{supply.supply_ID}</span>
      ),
    },
    { 
      key: 'supply_Name', 
      header: 'Supply Name',
      render: (supply: Supply) => (
        <div className="flex items-center space-x-2">
          <Package className="w-4 h-4 text-primary-500" />
          <span className="font-medium">{supply.supply_Name}</span>
        </div>
      ),
    },
    { 
      key: 'category', 
      header: 'Category',
      render: (supply: Supply) => (
        <Badge variant="default">{supply.category}</Badge>
      ),
    },
    { 
      key: 'quantity', 
      header: 'Stock',
      render: (supply: Supply) => {
        const status = getStockStatus(supply.quantity);
        return (
          <div className="flex items-center space-x-2">
            {supply.quantity === 0 && <AlertTriangle className="w-4 h-4 text-red-500" />}
            {supply.quantity > 0 && supply.quantity <= 10 && <TrendingDown className="w-4 h-4 text-yellow-500" />}
            <span className="font-semibold">{supply.quantity} {supply.unit}</span>
            <Badge variant={status.variant} size="sm">{status.label}</Badge>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (supply: Supply) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={() => handleViewSupply(supply)}>
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleOpenModal(supply)}>
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="primary" 
            onClick={() => handleOpenTransactionModal(supply)}
            disabled={supply.quantity === 0}
          >
            <Package className="w-4 h-4 mr-1" />
            Use
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(supply)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const handleViewSupply = (s: Supply) => {
    setSelectedSupply(s);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedSupply(null);
  };

  if (!isDoctor()) {
    return null;
  }

  return (
    <div>
      {}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-600">
          <span 
            className="hover:text-primary-600 cursor-pointer"
            onClick={() => router.push('/dashboard')}
          >
            Dashboard
          </span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Supplies</span>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplies Management</h1>
          <p className="text-gray-600 mt-1">Manage clinic supplies and inventory</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-5 h-5 mr-2" />
          Add Supply
        </Button>
      </div>

      {alert && (
        <div className="mb-4">
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Supplies</p>
              <p className="text-2xl font-bold text-gray-900">{supplies.length}</p>
            </div>
            <Package className="w-8 h-8 text-primary-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Stock</p>
              <p className="text-2xl font-bold text-green-600">
                {supplies.filter(s => s.quantity > 10).length}
              </p>
            </div>
            <Package className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">
                {supplies.filter(s => s.quantity > 0 && s.quantity <= 10).length}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">
                {supplies.filter(s => s.quantity === 0).length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {}
      <Card className="mb-6">
        <div className="space-y-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search supplies by name or category..."
          />
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
              <Tabs
                tabs={[
                  { id: 'all', label: 'All', count: supplies.length },
                  { id: 'low', label: 'Low Stock', count: supplies.filter(s => s.quantity > 0 && s.quantity <= 10).length },
                  { id: 'out', label: 'Out of Stock', count: supplies.filter(s => s.quantity === 0).length },
                ]}
                activeTab={stockFilter}
                onChange={(tab) => setStockFilter(tab as 'all' | 'low' | 'out')}
              />
            </div>
            {getUniqueCategories().length > 1 && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Categories</option>
                  {getUniqueCategories().map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </Card>

        {}
        <SupplyDetailsModal isOpen={isDetailsOpen} onClose={handleCloseDetails} supply={selectedSupply} />
      <Card>
        <Table
          data={filteredSupplies as unknown as Record<string, unknown>[]}
          columns={columns as any}
          isLoading={isLoading}
          emptyMessage="No supplies found. Try adjusting your filters."
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingSupply ? 'Edit Supply' : 'Add New Supply'}
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Supply Name"
            name="supply_Name"
            value={formData.supply_Name}
            onChange={handleChange}
            required
          />
          <Input
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="e.g., PPE, Medication, Tools"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
            <Input
              label="Unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              placeholder="e.g., Box, Piece"
              required
            />
          </div>
          <div className="mb-4">
            <AIAutoCompleteTextarea
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Optional details about this supply (e.g., brand, specifications, usage notes)"
              label="Description (Optional)"
              showAIBadge={true}
              minChars={10}
              debounceMs={300}
              context={`Supply: ${formData.supply_Name || 'new supply'}, Category: ${formData.category || 'uncategorized'}, Unit: ${formData.unit || 'unknown'}`}
              rows={3}
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingSupply ? 'Update' : 'Create'} Supply
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isTransactionModalOpen}
        onClose={handleCloseTransactionModal}
        title={`Use Supply: ${selectedSupply?.supply_Name}`}
      >
        <form onSubmit={handleTransactionSubmit}>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Current Stock: <span className="font-semibold">{selectedSupply?.quantity} {selectedSupply?.unit}</span>
            </p>
          </div>

          <Input
            label="Quantity to Use"
            type="number"
            name="quantity"
            value={transactionData.quantity}
            onChange={handleTransactionChange}
            max={selectedSupply?.quantity}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              name="date"
              value={transactionData.date}
              onChange={handleTransactionChange}
              required
            />
            <Input
              label="Time"
              type="time"
              name="time"
              value={transactionData.time}
              onChange={handleTransactionChange}
              required
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={handleCloseTransactionModal}>
              Cancel
            </Button>
            <Button type="submit">
              Record Transaction
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Supply"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
      />
    </div>
  );
}
