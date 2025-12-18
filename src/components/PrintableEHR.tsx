'use client';

import { EHR, Patient, Appointment } from '@/types/api.types';
import { formatDateForDisplay, formatTimeForDisplay } from '@/utils/date.utils';
import { getEhrId } from '@/utils/ehr.utils';
import { useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface PrintableEHRProps {
  ehr: EHR;
  patient: Patient;
  appointment?: Appointment;
}

export default function PrintableEHR({ ehr, patient, appointment }: PrintableEHRProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const printDate = new Date().toLocaleDateString('default', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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

  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = `
      <style>
        @page { size: A4 portrait; margin: 12mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 12px;
          line-height: 1.5;
          color: #111;
          background: #fff;
        }
        .print-container { padding: 0; max-width: 100%; }
        .page-break { page-break-before: always; }
        table { 
          page-break-inside: avoid;
          border-collapse: collapse;
          width: 100%;
        }
        tr { page-break-inside: avoid; page-break-after: auto; }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        
        /* Tailwind-like utilities needed for the component */
        .bg-white { background-color: #fff; }
        .bg-gray-100 { background-color: #f3f4f6; }
        .bg-yellow-50 { background-color: #fefce8; }
        .bg-blue-50 { background-color: #eff6ff; }
        .border { border-width: 1px; }
        .border-2 { border-width: 2px; }
        .border-gray-300 { border-color: #d1d5db; }
        .border-gray-800 { border-color: #1f2937; }
        .border-yellow-300 { border-color: #fde047; }
        .border-blue-300 { border-color: #93c5fd; }
        .border-b { border-bottom-width: 1px; }
        .border-b-2 { border-bottom-width: 2px; }
        .border-t-2 { border-top-width: 2px; }
        .rounded { border-radius: 0.25rem; }
        .rounded-lg { border-radius: 0.5rem; }
        .p-3 { padding: 0.75rem; }
        .p-4 { padding: 1rem; }
        .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
        .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
        .pt-4 { padding-top: 1rem; }
        .pb-2 { padding-bottom: 0.5rem; }
        .pb-4 { padding-bottom: 1rem; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-8 { margin-top: 2rem; }
        .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
        .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .text-xs { font-size: 0.75rem; line-height: 1rem; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .font-mono { font-family: monospace; }
        .text-gray-600 { color: #4b5563; }
        .text-gray-700 { color: #374151; }
        .text-gray-800 { color: #1f2937; }
        .text-gray-900 { color: #111827; }
        .text-left { text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .whitespace-pre-wrap { white-space: pre-wrap; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .gap-x-8 { column-gap: 2rem; }
        .gap-y-2 { row-gap: 0.5rem; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .w-full { width: 100%; }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>EHR - ${patient.first} ${patient.last}</title>
          ${styles}
        </head>
        <body>
          ${printRef.current.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <>
      <div ref={printRef} className="print-container bg-white p-8 max-w-[210mm] mx-auto">
        {}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Electronic Health Record</h1>
          <div className="mt-2 text-sm text-gray-600">
            <p>Printed: {printDate}</p>
            <p>Record ID: {getEhrId(ehr)}</p>
          </div>
        </div>

        {}
        <div className="mb-6 border border-gray-300 p-4 rounded">
          <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">
            Patient Information
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="font-semibold">Name:</span>{' '}
              {patient.first} {patient.middle} {patient.last}
            </div>
            <div>
              <span className="font-semibold">Patient ID:</span> {patient.patient_ID}
            </div>
            <div>
              <span className="font-semibold">Gender:</span> {patient.gender}
            </div>
            <div>
              <span className="font-semibold">Date of Birth:</span>{' '}
              {formatDateForDisplay(patient.dob)} ({calculateAge(patient.dob)} years old)
            </div>
            <div>
              <span className="font-semibold">Phone:</span> {patient.phone}
            </div>
            {appointment && (
              <div>
                <span className="font-semibold">Appointment:</span>{' '}
                {formatDateForDisplay(appointment.date)} at {formatTimeForDisplay(appointment.time)}
              </div>
            )}
          </div>
        </div>

        {}
        {(ehr.allergies || ehr.medicalAlerts || ehr.history) && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">
              General Medical Information
            </h2>
            
            {ehr.allergies && (
              <div className="mb-3">
                <h3 className="font-semibold text-gray-800 mb-1">Allergies:</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{ehr.allergies}</p>
              </div>
            )}
            
            {ehr.medicalAlerts && (
              <div className="mb-3 bg-yellow-50 border border-yellow-300 p-3 rounded">
                <h3 className="font-semibold text-gray-800 mb-1">
                  <span className="inline-flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span>Medical Alerts:</span>
                  </span>
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{ehr.medicalAlerts}</p>
              </div>
            )}
            
            {ehr.history && (
              <div className="mb-3">
                <h3 className="font-semibold text-gray-800 mb-1">Medical History:</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{ehr.history}</p>
              </div>
            )}
          </div>
        )}

        {}
        {(ehr.diagnosis || ehr.xRayFindings || ehr.periodontalStatus) && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">
              Diagnosis & Findings
            </h2>
            
            {ehr.diagnosis && (
              <div className="mb-3">
                <h3 className="font-semibold text-gray-800 mb-1">Diagnosis:</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{ehr.diagnosis}</p>
              </div>
            )}
            
            {ehr.xRayFindings && (
              <div className="mb-3">
                <h3 className="font-semibold text-gray-800 mb-1">X-Ray Findings:</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{ehr.xRayFindings}</p>
              </div>
            )}
            
            {ehr.periodontalStatus && (
              <div className="mb-3">
                <h3 className="font-semibold text-gray-800 mb-1">Periodontal Status:</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{ehr.periodontalStatus}</p>
              </div>
            )}
          </div>
        )}

        {}
        {ehr.medications && ehr.medications.length > 0 && (
          <div className="mb-6 page-break">
            <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">
              Medications ({ehr.medications.length})
            </h2>
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left">Name</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Dosage</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Frequency</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Route</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Duration</th>
                </tr>
              </thead>
              <tbody>
                {ehr.medications.map((med, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-2 py-1">{med.name}</td>
                    <td className="border border-gray-300 px-2 py-1">{med.dosage}</td>
                    <td className="border border-gray-300 px-2 py-1">{med.frequency}</td>
                    <td className="border border-gray-300 px-2 py-1">{med.route}</td>
                    <td className="border border-gray-300 px-2 py-1">
                      {med.startDate ? formatDateForDisplay(med.startDate) : 'N/A'} to{' '}
                      {med.endDate ? formatDateForDisplay(med.endDate) : 'Ongoing'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {}
        {ehr.procedures && ehr.procedures.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">
              Procedures ({ehr.procedures.length})
            </h2>
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left">Code</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Description</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Tooth #</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Date</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {ehr.procedures.map((proc, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-2 py-1 font-mono">{proc.code}</td>
                    <td className="border border-gray-300 px-2 py-1">{proc.description}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      <div>{proc.toothNumber ?? '-'}</div>
                      {proc.toothName && <div className="text-xs text-gray-600">{proc.toothName}</div>}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {proc.performedAt ? formatDateForDisplay(proc.performedAt) : 'N/A'}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">{proc.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {}
        {ehr.teeth && ehr.teeth.length > 0 && (
          <div className="mb-6 page-break">
            <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">
              Tooth Records ({ehr.teeth.length})
            </h2>
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left">Tooth #</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Condition</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Surfaces</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Treatment Planned</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Treatment Completed</th>
                </tr>
              </thead>
              <tbody>
                {ehr.teeth.map((tooth, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-2 py-1 text-center font-semibold">
                      <div>{tooth.toothNumber ?? '-'}</div>
                      {tooth.toothName && <div className="text-xs text-gray-600">{tooth.toothName}</div>}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">{tooth.condition}</td>
                    <td className="border border-gray-300 px-2 py-1">{tooth.surfaces || '-'}</td>
                    <td className="border border-gray-300 px-2 py-1">
                      {tooth.treatmentPlanned || '-'}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {tooth.treatmentCompleted || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {}
        {ehr.xRays && ehr.xRays.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">
              X-Rays ({ehr.xRays.length})
            </h2>
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left">Type</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Date Taken</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Taken By</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Findings</th>
                </tr>
              </thead>
              <tbody>
                {ehr.xRays.map((xray, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-2 py-1">{xray.type}</td>
                    <td className="border border-gray-300 px-2 py-1">
                      {xray.takenAt ? formatDateForDisplay(xray.takenAt) : 'N/A'}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">{xray.takenBy}</td>
                    <td className="border border-gray-300 px-2 py-1 text-xs">{xray.findings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {}
        {(ehr.clinicalNotes || ehr.treatments || ehr.recommendations) && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">
              Clinical Notes & Recommendations
            </h2>
            
            {ehr.clinicalNotes && (
              <div className="mb-3">
                <h3 className="font-semibold text-gray-800 mb-1">Clinical Notes:</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{ehr.clinicalNotes}</p>
              </div>
            )}
            
            {ehr.treatments && (
              <div className="mb-3">
                <h3 className="font-semibold text-gray-800 mb-1">Treatments:</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{ehr.treatments}</p>
              </div>
            )}
            
            {ehr.recommendations && (
              <div className="mb-3 bg-blue-50 border border-blue-300 p-3 rounded">
                <h3 className="font-semibold text-gray-800 mb-1">Recommendations:</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{ehr.recommendations}</p>
              </div>
            )}
          </div>
        )}

        {}
        <div className="mt-8 pt-4 border-t-2 border-gray-300 text-sm text-gray-600">
          <div className="flex justify-between">
            <div>
              <p>Last Updated: {ehr.updatedAt ? formatDateForDisplay(ehr.updatedAt) : 'N/A'}</p>
              <p>Updated By: {ehr.updatedBy}</p>
            </div>
            <div className="text-right">
              <p>This is an official medical record</p>
              <p>Confidential Patient Information</p>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="mt-6 text-center">
        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
        >
          Print EHR
        </button>
      </div>
    </>
  );
}
