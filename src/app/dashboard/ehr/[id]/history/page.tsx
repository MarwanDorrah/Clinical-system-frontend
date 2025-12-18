'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import EHRTimeline from '@/components/EHRTimeline';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ehrService } from '@/services';
import { ChangeLog, ApiError } from '@/types/api.types';
import { ArrowLeft, History, ChevronRight } from 'lucide-react';

export default function EHRHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const ehrId = Number(params?.id);

  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!ehrId || isNaN(ehrId)) {
      router.push('/dashboard/ehr');
      return;
    }
    fetchHistory();
  }, [ehrId]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const data = await ehrService.getHistory(ehrId) as ChangeLog[];
      setChangeLogs(data);
    } catch (error) {
      const apiError = error as ApiError;
      setAlert({ 
        type: 'error', 
        message: apiError.error || 'Failed to load EHR history' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/ehr');
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-600">
          <span 
            className="hover:text-primary-600 cursor-pointer"
            onClick={() => router.push('/dashboard')}
          >
            Dashboard
          </span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span 
            className="hover:text-primary-600 cursor-pointer"
            onClick={() => router.push('/dashboard/ehr')}
          >
            EHR Records
          </span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">History</span>
        </div>
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleBack}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <History className="w-8 h-8 text-primary-600" />
          EHR CHANGE HISTORY
        </h1>
        <p className="text-gray-600 mt-2">
          View complete audit trail of changes made to EHR #{ehrId}
        </p>
      </div>

      {alert && (
        <div className="mb-4">
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {isLoading ? (
        <Card>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </Card>
      ) : (
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <History className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Change Timeline
              </h2>
              <span className="text-sm text-gray-500 ml-auto">
                {changeLogs.length} {changeLogs.length === 1 ? 'change' : 'changes'} recorded
              </span>
            </div>
            
            <EHRTimeline changeLogs={changeLogs} />
          </div>
        </Card>
      )}

      <div className="mt-6 flex gap-3">
        <Button
          variant="outline"
          onClick={handleBack}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to EHR Records
        </Button>
      </div>
    </div>
  );
}
