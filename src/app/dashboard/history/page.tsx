'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import SearchBar from '@/components/SearchBar';
import LoadingSpinner from '@/components/LoadingSpinner';
import Alert from '@/components/Alert';
import { stockTransactionService, supplyService, doctorService } from '@/services';
import { StockTransaction, Supply, Doctor } from '@/types/api.types';
import { formatDateForDisplay } from '@/utils/date.utils';
import { useAuth } from '@/contexts/AuthContext';
import { History, Calendar, Package, User, Download, Filter, ChevronRight, TrendingDown, Clock } from 'lucide-react';

export default function TransactionHistoryPage() {
  const router = useRouter();
  const { isDoctor } = useAuth();
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<StockTransaction[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDoctor, setFilterDoctor] = useState<string>('all');
  const [filterSupply, setFilterSupply] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalQuantity: 0,
    uniqueSupplies: 0,
    uniqueDoctors: 0,
  });

  useEffect(() => {
    if (!isDoctor()) {
      router.push('/dashboard');
      return;
    }
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchQuery, filterDoctor, filterSupply, dateFrom, dateTo, supplies, doctors]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [transactionsData, suppliesData, doctorsData] = await Promise.all([
        stockTransactionService.getAllTransactions(),
        supplyService.getAllSupplies(),
        doctorService.getAllDoctors(),
      ]);
      
      setTransactions(transactionsData as StockTransaction[]);
      setSupplies(suppliesData as Supply[]);
      setDoctors(doctorsData as Doctor[]);
      
      calculateStats(transactionsData as StockTransaction[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      showAlert('error', 'Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data: StockTransaction[]) => {
    const totalQuantity = data.reduce((sum, t) => sum + t.quantity, 0);
    const uniqueSupplies = new Set(data.map(t => t.supply_ID)).size;
    const uniqueDoctors = new Set(data.map(t => t.doctor_ID)).size;
    
    setStats({
      totalTransactions: data.length,
      totalQuantity,
      uniqueSupplies,
      uniqueDoctors,
    });
  };

  const applyFilters = () => {
    let filtered = [...transactions];

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

    if (filterDoctor !== 'all') {
      filtered = filtered.filter(t => t.doctor_ID === Number(filterDoctor));
    }

    if (filterSupply !== 'all') {
      filtered = filtered.filter(t => t.supply_ID === Number(filterSupply));
    }

    if (dateFrom) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(dateFrom));
    }

    if (dateTo) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(dateTo));
    }

    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredTransactions(filtered);
  };

  const getSupplyName = (supplyId: number) => {
    const supply = supplies.find(s => s.supply_ID === supplyId);
    return supply ? supply.supply_Name : `Supply #${supplyId}`;
  };

  const getDoctorName = (doctorId: number) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : `Doctor #${doctorId}`;
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Date', 'Time', 'Supply', 'Quantity', 'Doctor'],
      ...filteredTransactions.map(t => [
        t.t_ID,
        formatDateForDisplay(t.date),
        t.time,
        getSupplyName(t.supply_ID),
        t.quantity,
        getDoctorName(t.doctor_ID)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showAlert('success', 'Transaction history exported successfully');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterDoctor('all');
    setFilterSupply('all');
    setDateFrom('');
    setDateTo('');
  };

  const groupByDate = (data: StockTransaction[]) => {
    const grouped = data.reduce((acc, transaction) => {
      const date = transaction.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(transaction);
      return acc;
    }, {} as Record<string, StockTransaction[]>);

    return Object.entries(grouped).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading transaction history..." />;
  }

  const groupedTransactions = groupByDate(filteredTransactions);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <span className="hover:text-primary-600 cursor-pointer" onClick={() => router.push('/dashboard')}>
              Dashboard
            </span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-900 font-medium">Transaction History</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <History className="w-8 h-8 text-primary-600" />
            Transaction History
          </h1>
          <p className="text-gray-600 mt-2">Complete record of all stock transactions and usage</p>
        </div>
        <Button onClick={handleExport} variant="secondary">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {alert && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Transactions</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalTransactions}</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <History className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Quantity Used</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalQuantity}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Supplies Used</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.uniqueSupplies}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Staff Members</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.uniqueDoctors}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary-600" />
              Filters & Search
            </h2>
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <SearchBar
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Doctor</label>
              <select
                value={filterDoctor}
                onChange={(e) => setFilterDoctor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Doctors</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supply</label>
              <select
                value={filterSupply}
                onChange={(e) => setFilterSupply(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Supplies</option>
                {supplies.map((supply) => (
                  <option key={supply.supply_ID} value={supply.supply_ID}>
                    {supply.supply_Name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {(searchQuery || filterDoctor !== 'all' || filterSupply !== 'all' || dateFrom || dateTo) && (
            <div className="pt-2">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredTransactions.length}</span> of {transactions.length} transactions
              </p>
            </div>
          )}
        </div>
      </Card>

      {groupedTransactions.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Found</h3>
            <p className="text-gray-600">
              {searchQuery || filterDoctor !== 'all' || filterSupply !== 'all' || dateFrom || dateTo
                ? 'Try adjusting your filters to see more results.'
                : 'No transaction history available yet.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedTransactions.map(([date, dayTransactions]) => (
            <Card key={date}>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                <Calendar className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {formatDateForDisplay(date)}
                </h3>
                <Badge variant="info" size="sm">
                  {dayTransactions.length} transaction{dayTransactions.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="space-y-3">
                {dayTransactions.map((transaction) => (
                  <div
                    key={transaction.t_ID}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg">
                        <Clock className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{getSupplyName(transaction.supply_ID)}</span>
                          <Badge variant="default" size="sm">
                            ID: {transaction.t_ID}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {transaction.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {getDoctorName(transaction.doctor_ID)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">-{transaction.quantity}</div>
                      <div className="text-xs text-gray-500">units</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Daily Total:</span>
                  <span className="font-semibold text-gray-900">
                    {dayTransactions.reduce((sum, t) => sum + t.quantity, 0)} units used
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
