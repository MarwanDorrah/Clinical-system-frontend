'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import { getEhrId } from '@/utils/ehr.utils';
import Button from '@/components/Button';
import Alert from '@/components/Alert';
import Tabs from '@/components/Tabs';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import EHRTimeline from '@/components/EHRTimeline';
import { ehrService, patientService } from '@/services';
import { EHR, Patient, ApiError } from '@/types/api.types';
import { FileText, Activity, Eye, History, Clock, Edit, Plus, Download } from 'lucide-react';

export default function EHRPage() {
  const router = useRouter();
  const [ehrs, setEhrs] = useState<EHR[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [selectedEHR, setSelectedEHR] = useState<EHR | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'timeline'>('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [ehrsData, patientsData] = await Promise.all([
        ehrService.getAllEHRs() as Promise<EHR[]>,
        patientService.getAllPatients() as Promise<Patient[]>,
      ]);
      console.log('Fetched EHRs:', ehrsData);
      console.log('EHR IDs:', ehrsData.map(e => ({ id: getEhrId(e), patient: e.patient_ID })));
      
      // Filter out any EHRs without a valid ID
      const validEhrs = ehrsData.filter(ehr => {
        const id = getEhrId(ehr);
        if (!id) {
          console.warn('Found EHR without valid ID:', ehr);
          return false;
        }
        return true;
      });
      
      if (validEhrs.length !== ehrsData.length) {
        showAlert('error', `Found ${ehrsData.length - validEhrs.length} invalid EHR record(s) without ID`);
      }
      
      setEhrs(validEhrs);
      setPatients(patientsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showAlert('error', 'Failed to load EHR data');
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleOpenHistoryModal = (ehr: EHR) => {
    setSelectedEHR(ehr);
    setIsHistoryModalOpen(true);
  };

  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setSelectedEHR(null);
  };

  const handleExportHistory = () => {
    if (!selectedEHR) return;
    
    // Create a simple text export of the change history
    const changes = selectedEHR.changeLogs || [];
    const exportText = `Change History - EHR #${getEhrId(selectedEHR)}\n` +
      `Total Changes: ${changes.length}\n` +
      `Last Updated: ${selectedEHR.updatedAt ? new Date(selectedEHR.updatedAt).toLocaleString() : 'N/A'}\n\n` +
      changes.map(log => 
        `${new Date(log.changedAt).toLocaleString()}\n` +
        `User: ${log.changedByDoctorName}\n` +
        `Action: ${log.changeType}\n` +
        `Field: ${log.fieldName}\n` +
        (log.oldValue ? `Old Value: ${log.oldValue}\n` : '') +
        (log.newValue ? `New Value: ${log.newValue}\n` : '') +
        `\n---\n`
      ).join('\n');
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EHR_${getEhrId(selectedEHR)}_History.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePatientChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const patientId = e.target.value;
    setSelectedPatient(patientId);

    if (patientId) {
      try {
        const patientEhrs = await ehrService.getByPatient(parseInt(patientId)) as EHR[];
        setEhrs(patientEhrs);
      } catch (error) {
        showAlert('error', 'Failed to load patient EHRs');
      }
    } else {
      fetchData();
    }
  };

  return (
    <div className="max-w-full overflow-hidden">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Electronic Health Records</h1>
          <p className="text-gray-600 mt-1">View and manage patient health records</p>
        </div>
        <Button onClick={() => router.push('/dashboard/ehr/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          New EHR
        </Button>
      </div>

      {alert && (
        <div className="mb-4">
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      <div className="mb-6">
        <Card>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <label className="text-sm font-medium text-gray-700 flex-shrink-0">Filter by Patient:</label>
            <select
              value={selectedPatient}
              onChange={handlePatientChange}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Patients</option>
              {patients.map((patient) => (
                <option key={patient.patient_ID} value={patient.patient_ID}>
                  {patient.first} {patient.last}
                </option>
              ))}
            </select>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="mb-6">
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview', count: ehrs.length },
            { id: 'details', label: 'Details' },
            { id: 'timeline', label: 'Timeline' },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as 'overview' | 'details' | 'timeline')}
        />
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : ehrs.length > 0 ? (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ehrs.slice(0, 6).map((ehr, index) => (
                <Card key={getEhrId(ehr) || `ehr-${index}`}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {ehr.patient?.first} {ehr.patient?.last}
                        </h3>
                        <p className="text-xs text-gray-500">EHR #{getEhrId(ehr)}</p>
                      </div>
                      <FileText className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    </div>
                    
                    {ehr.diagnosis && (
                      <p className="text-sm text-gray-700 line-clamp-2">{ehr.diagnosis}</p>
                    )}
                    
                    <div className="pt-2 border-t border-gray-200 space-y-3">
                      <p className="text-xs text-gray-500">
                        Last update: {ehr.updatedAt ? Math.floor((new Date().getTime() - new Date(ehr.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0} days ago
                      </p>
                      
                      {/* Stats Row */}
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span>💊 {ehr.medications?.length || 0} Medications</span>
                        <span>🦷 {ehr.procedures?.length || 0} Procedures</span>
                        <span>📸 {ehr.xRays?.length || 0} X-Rays</span>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const ehrId = getEhrId(ehr);
                            if (!ehrId) {
                              showAlert('error', 'Invalid EHR: Missing ID');
                              return;
                            }
                            router.push(`/dashboard/ehr/${ehrId}`);
                          }}
                          disabled={!getEhrId(ehr)}
                          className="flex-1 sm:flex-initial min-w-[70px]"
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const ehrId = getEhrId(ehr);
                            console.log('Edit button clicked for EHR:', ehrId, 'Full EHR object:', ehr);
                            if (!ehrId) {
                              showAlert('error', 'Invalid EHR: Missing ID');
                              console.error('Cannot edit EHR: ehr_ID is undefined', ehr);
                              return;
                            }
                            router.push(`/dashboard/ehr/edit/${ehrId}`);
                          }}
                          disabled={!getEhrId(ehr)}
                          className="flex-1 sm:flex-initial min-w-[70px]"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const ehrId = getEhrId(ehr);
                            if (!ehrId) {
                              showAlert('error', 'Invalid EHR: Missing ID');
                              return;
                            }
                            router.push(`/dashboard/ehr/${ehrId}/history`);
                          }}
                          disabled={!getEhrId(ehr)}
                          className="flex-1 sm:flex-initial min-w-[70px]"
                        >
                          History
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-3 sm:space-y-4">
              {ehrs.map((ehr, index) => (
                <Card key={getEhrId(ehr) || `ehr-${index}`}>
                  <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                      Patient: {ehr.patient?.first} {ehr.patient?.last}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 break-words">
                      Last Updated: {ehr.updatedAt ? new Date(ehr.updatedAt!).toLocaleString() : 'N/A'} by {ehr.updatedBy}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0">
                    EHR #{getEhrId(ehr)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {ehr.allergies && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Allergies</p>
                      <p className="text-gray-900">{ehr.allergies}</p>
                    </div>
                  )}
                  {ehr.medicalAlerts && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Medical Alerts</p>
                      <p className="text-gray-900">{ehr.medicalAlerts}</p>
                    </div>
                  )}
                  {ehr.diagnosis && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Diagnosis</p>
                      <p className="text-gray-900">{ehr.diagnosis}</p>
                    </div>
                  )}
                  {ehr.periodontalStatus && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Periodontal Status</p>
                      <p className="text-gray-900">{ehr.periodontalStatus}</p>
                    </div>
                  )}
                </div>

                {ehr.clinicalNotes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Clinical Notes</p>
                    <p className="text-gray-900 mt-1">{ehr.clinicalNotes}</p>
                  </div>
                )}

                {ehr.recommendations && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Recommendations</p>
                    <p className="text-gray-900 mt-1">{ehr.recommendations}</p>
                  </div>
                )}

                {ehr.medications && ehr.medications.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Medications</p>
                    <div className="space-y-2">
                      {ehr.medications.map((med, index) => (
                        <div key={med.medication_ID || `med-${getEhrId(ehr)}-${index}`} className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium text-gray-900">{med.name} - {med.dosage}</p>
                          <p className="text-sm text-gray-600">
                            {med.frequency} ({med.route}) | {med.startDate} to {med.endDate}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ehr.procedures && ehr.procedures.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Procedures</p>
                    <div className="space-y-2">
                      {ehr.procedures.map((proc, index) => (
                        <div key={proc.procedure_ID || `proc-${getEhrId(ehr)}-${index}`} className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium text-gray-900">
                            {proc.description} (Code: {proc.code})
                          </p>
                          <p className="text-sm text-gray-600">
                            Tooth #{proc.toothNumber} | Status: {proc.status}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                  </div>
                  
                  {/* Action Buttons for Details View */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const ehrId = getEhrId(ehr);
                        console.log('Edit button clicked (details view) for EHR:', ehrId, 'Full EHR object:', ehr);
                        if (!ehrId) {
                          showAlert('error', 'Invalid EHR: Missing ID');
                          console.error('Cannot edit EHR: ehr_ID is undefined', ehr);
                          return;
                        }
                        router.push(`/dashboard/ehr/edit/${ehrId}`);
                      }}
                      disabled={!getEhrId(ehr)}
                      className="flex-1 sm:flex-initial"
                    >
                      Edit Record
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenHistoryModal(ehr)}
                      className="flex-1 sm:flex-initial"
                    >
                      View History
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <Card>
              <EHRTimeline
                changeLogs={ehrs.flatMap(ehr => ehr.changeLogs || [])}
                ehrRecords={ehrs}
              />
            </Card>
          )}
        </>
      ) : (
        <Card>
          <p className="text-center text-gray-500 py-12">No EHR records found</p>
        </Card>
      )}

      {/* Change History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={handleCloseHistoryModal}
        title={`Change History - ${selectedEHR?.patient?.first} ${selectedEHR?.patient?.last}`}
        size="xl"
      >
        {selectedEHR && (() => {
          // Get all EHR records for this patient
          const patientEhrs = ehrs.filter(ehr => ehr.patient_ID === selectedEHR.patient_ID);
          
          // Combine all change logs from this patient's EHRs and sort by date
          const allPatientChanges = patientEhrs
            .flatMap(ehr => 
              (ehr.changeLogs || []).map(log => ({
                ...log,
                ehrId: getEhrId(ehr),
                timestamp: (log as any).timestamp || ehr.updatedAt || new Date().toISOString()
              }))
            )
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          return (
            <div className="space-y-6">
              {/* Header Stats */}
              <div className="flex flex-col gap-3 p-4 bg-gradient-to-r from-blue-50 to-primary-50 rounded-lg border border-blue-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {selectedEHR.patient?.first} {selectedEHR.patient?.last}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Patient ID: {selectedEHR.patient_ID}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">📊 Total Changes</p>
                    <p className="text-2xl font-bold text-primary-600">{allPatientChanges.length}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-blue-200">
                  <p className="text-xs text-gray-600">
                    Showing all changes across {patientEhrs.length} EHR {patientEhrs.length === 1 ? 'record' : 'records'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Last Updated: {selectedEHR.updatedAt ? new Date(selectedEHR.updatedAt!).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Change Log List */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin">
                {allPatientChanges.length > 0 ? (
                  allPatientChanges.map((log, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow">
                      {/* Header with Timestamp, User, and EHR ID */}
                      <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <div>
                            <span className="text-sm font-medium text-gray-900 block">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {(log as any).changedBy || selectedEHR.updatedBy || 'System'}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium whitespace-nowrap">
                          EHR #{log.ehrId}
                        </span>
                      </div>

                    {/* Change Type */}
                    <div className="space-y-2">
                      {log.changeType === 'Added' && (
                        <div className="flex items-start gap-2">
                          <Plus className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-green-900">ADDED: {log.fieldName}</p>
                            {log.newValue && (
                              <p className="text-sm text-gray-700 mt-1">"{log.newValue}"</p>
                            )}
                          </div>
                        </div>
                      )}

                      {log.changeType === 'Modified' && (
                        <div className="flex items-start gap-2">
                          <Edit className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900">UPDATED: {log.fieldName}</p>
                            {log.oldValue && (
                              <p className="text-sm text-gray-600 mt-1">
                                Old: "{log.oldValue}"
                              </p>
                            )}
                            {log.newValue && (
                              <p className="text-sm text-gray-700 mt-1">
                                New: "{log.newValue}"
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {log.changeType === 'Deleted' && (
                        <div className="flex items-start gap-2">
                          <Badge variant="danger">DELETED: {log.fieldName}</Badge>
                          {log.oldValue && (
                            <p className="text-sm text-gray-600 mt-1">
                              Removed: "{log.oldValue}"
                            </p>
                          )}
                        </div>
                      )}

                      {log.changeType === 'Created' && (
                        <div className="flex items-start gap-2">
                          <Plus className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-primary-900">CREATED: EHR Record</p>
                            <p className="text-sm text-gray-700 mt-1">
                              Initial creation for appointment {(log as any).appointmentRef || 'N/A'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No change history available</p>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 justify-between">
                <Button
                  variant="outline"
                  onClick={handleExportHistory}
                  icon={<Download className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  Export History
                </Button>
                <Button 
                  onClick={handleCloseHistoryModal}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
