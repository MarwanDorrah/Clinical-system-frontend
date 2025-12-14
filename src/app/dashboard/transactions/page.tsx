'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import Input from '@/components/Input';
import Alert from '@/components/Alert';
import Badge from '@/components/Badge';
import SearchBar from '@/components/SearchBar';
import ConfirmDialog from '@/components/ConfirmDialog';
import { stockTransactionService, isDoctor, getUserId, supplyService, doctorService } from '@/services';
import { StockTransaction, ApiError, Supply, Doctor, StockTransactionCreateRequest } from '@/types/api.types';
import { formatDateForDisplay } from '@/utils/date.utils';
import { TrendingUp, TrendingDown, Plus, ChevronRight, Filter, Package, AlertTriangle, Clock } from 'lucide-react';

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<StockTransaction[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [filterDoctor, setFilterDoctor] = useState<string>('all');
  const [filterSupply, setFilterSupply] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastTransactionDate, setLastTransactionDate] = useState<string>('');
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: number | null;
    supplyName: string;
  }>({ isOpen: false, id: null, supplyName: '' });
  const [formData, setFormData] = useState({
    supply_ID: '',
    quantity: '',
  });
  const LOW_STOCK_THRESHOLD = 10; // Items with quantity <= this are considered low stock

  useEffect(() => {
    if (!isDoctor()) {
      router.push('/dashboard');
      return;
    }
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [filterDoctor, filterSupply]);

  useEffect(() => {
    // Apply search and sort filters to transactions
    let filtered = [...transactions];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => {
        const supplyName = getSupplyName(t.supply_ID).toLowerCase();
        const doctorName = getDoctorName(t.doctor_ID).toLowerCase();
        return supplyName.includes(query) || 
               doctorName.includes(query) || 
               t.t_ID.toString().includes(query);
      });
    }

    // Apply sorting
    switch (sortBy) {
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'qty-desc':
        filtered.sort((a, b) => b.quantity - a.quantity);
        break;
      case 'qty-asc':
        filtered.sort((a, b) => a.quantity - b.quantity);
        break;
      default:
        break;
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, sortBy, supplies, doctors]);

  const fetchInitialData = async () => {
    try {
      const [suppliesData, doctorsData] = await Promise.all([
        supplyService.getAllSupplies(),
        doctorService.getAllDoctors(),
      ]);
      setSupplies(suppliesData as Supply[]);
      setDoctors(doctorsData as Doctor[]);
      
      // Calculate inventory stats
      const suppliesArray = suppliesData as Supply[];
      const totalQuantity = suppliesArray.reduce((sum, s) => sum + s.quantity, 0);
      setTotalItems(totalQuantity);
      
      const lowStock = suppliesArray.filter(s => s.quantity <= LOW_STOCK_THRESHOLD).length;
      setLowStockCount(lowStock);
      
      await fetchTransactions();
    } catch (error) {
      console.error('Error fetching initial data:', error);
      showAlert('error', 'Failed to load data');
    }
  };

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      let data: StockTransaction[];

      if (filterDoctor !== 'all') {
        data = await stockTransactionService.getByDoctor(Number(filterDoctor)) as StockTransaction[];
      } else if (filterSupply !== 'all') {
        data = await stockTransactionService.getBySupply(Number(filterSupply)) as StockTransaction[];
      } else {
        data = await stockTransactionService.getAllTransactions() as StockTransaction[];
      }

      setTransactions(data);
      
      // Update last transaction date
      if (data.length > 0) {
        const lastTx = data.reduce((latest, current) => {
          const currentDate = new Date(current.date);
          const latestDate = new Date(latest.date);
          return currentDate > latestDate ? current : latest;
        });
        setLastTransactionDate(lastTx.date);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showAlert('error', 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleOpenModal = () => {
    setFormData({
      supply_ID: '',
      quantity: '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supply_ID || !formData.quantity) {
      showAlert('error', 'Supply and quantity are required');
      return;
    }

    const quantity = Number(formData.quantity);
    if (quantity < 1) {
      showAlert('error', 'Quantity must be at least 1');
      return;
    }

    try {
      const now = new Date();
      const requestData: StockTransactionCreateRequest = {
        supply_ID: Number(formData.supply_ID),
        quantity: quantity,
        date: now.toISOString().split('T')[0], // YYYY-MM-DD
        time: now.toTimeString().split(' ')[0], // HH:mm:ss
        doctor_ID: getUserId() || 0,
      };
      
      await stockTransactionService.createTransaction(requestData);
      showAlert('success', 'Transaction recorded successfully');
      handleCloseModal();
      fetchTransactions();
    } catch (error) {
      const apiError = error as ApiError;
      showAlert('error', apiError.error || 'Operation failed');
    }
  };

  const getSupplyName = (supplyId: number) => {
    const supply = supplies.find(s => s.supply_ID === supplyId);
    return supply ? supply.supply_Name : `Supply #${supplyId}`;
  };

  const getDoctorName = (doctorId: number) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? `Dr. ${doctor.name}` : `Doctor #${doctorId}`;
  };

  const handleDeleteClick = (transaction: StockTransaction) => {
    setDeleteConfirm({
      isOpen: true,
      id: transaction.t_ID,
      supplyName: getSupplyName(transaction.supply_ID)
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;

    try {
      await stockTransactionService.deleteTransaction(deleteConfirm.id);
      showAlert('success', 'Transaction deleted successfully');
      setDeleteConfirm({ isOpen: false, id: null, supplyName: '' });
      fetchTransactions();
    } catch (error) {
      const apiError = error as ApiError;
      showAlert('error', apiError.error || 'Failed to delete transaction');
    }
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-600">
          <span className="hover:text-primary-600 cursor-pointer">Dashboard</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Inventory</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Stock Transactions</span>
        </div>
        <Button 
          size="sm" 
          onClick={handleOpenModal}
          icon={<Plus className="w-4 h-4" />}
        >
          + Add Entry
        </Button>
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Package className="w-8 h-8 text-primary-600" />
          STOCK TRANSACTIONS
        </h1>
        <p className="text-gray-600 mt-2">Track usage and deduction of dental supplies from inventory</p>
      </div>

      {/* Alert */}
      {alert && (
        <div className="mb-4">
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {/* Inventory Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Items</p>
              <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
            </div>
            <Package className="w-10 h-10 text-primary-200 bg-primary-50 rounded-lg p-2" />
          </div>
        </Card>
        
        <Card className="bg-white border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Low Stock Alerts</p>
              <p className="text-3xl font-bold text-orange-600">{lowStockCount}</p>
              <p className="text-xs text-gray-500 mt-1">≤ {LOW_STOCK_THRESHOLD} units</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-orange-200 bg-orange-50 rounded-lg p-2" />
          </div>
        </Card>
        
        <Card className="bg-white border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Last Transaction</p>
              <p className="text-lg font-semibold text-gray-900">
                {lastTransactionDate ? formatDateForDisplay(lastTransactionDate) : 'No data'}
              </p>
            </div>
            <Clock className="w-10 h-10 text-blue-200 bg-blue-50 rounded-lg p-2" />
          </div>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchBar 
                placeholder="🔍 Search transactions..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            >
              <option value="date-desc">Sort ▼</option>
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="qty-desc">Highest Qty</option>
              <option value="qty-asc">Lowest Qty</option>
            </select>
          </div>

          {/* Additional Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={filterDoctor}
              onChange={(e) => setFilterDoctor(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            >
              <option value="all">All Staff</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.name}
                </option>
              ))}
            </select>

            <select
              value={filterSupply}
              onChange={(e) => setFilterSupply(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            >
              <option value="all">All Supplies</option>
              {supplies.map((supply) => (
                <option key={supply.supply_ID} value={supply.supply_ID}>
                  {supply.supply_Name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span>📋</span> Recent Transactions
          </h3>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Supply Item</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Quantity</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Doctor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="inline-flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                      <span className="text-gray-600">Loading transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-600">
                    No transactions found. {searchQuery ? 'Try adjusting your search.' : 'Record your first transaction to get started.'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.t_ID} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{transaction.t_ID}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDateForDisplay(transaction.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {transaction.time}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {getSupplyName(transaction.supply_ID)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-semibold text-gray-900">
                        {transaction.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {getDoctorName(transaction.doctor_ID)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // TODO: Implement view details modal
                            showAlert('success', 'View details modal coming soon!');
                          }}
                          className="px-3 py-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleDeleteClick(transaction)}
                          className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filteredTransactions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredTransactions.length} of {transactions.length} transactions</span>
          </div>
        )}
      </Card>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Record Stock Transaction"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supply <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">📦 Select the supply item for this transaction (current stock shown)</p>
            <select
              name="supply_ID"
              value={formData.supply_ID}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select a supply...</option>
              {supplies.map((supply) => (
                <option key={supply.supply_ID} value={supply.supply_ID}>
                  {supply.supply_Name} (Current Stock: {supply.quantity})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">🔢 Enter the number of units to deduct from inventory (must be at least 1)</p>
            <Input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              placeholder="Enter quantity"
              required
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Note:</strong> This transaction will deduct the specified quantity from the selected supply's current stock.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              Record Transaction
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Transaction"
        message={`Are you sure you want to delete this transaction for "${deleteConfirm.supplyName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null, supplyName: '' })}
      />
    </div>
  );
}
