'use client';

import { EHR, Patient, Appointment } from '@/types/api.types';
import { formatDateForDisplay, formatTimeForDisplay } from '@/utils/date.utils';
import { getEhrId } from '@/utils/ehr.utils';

interface PrintableEHRProps {
  ehr: EHR;
  patient: Patient;
  appointment?: Appointment;
}

export default function PrintableEHR({ ehr, patient, appointment }: PrintableEHRProps) {
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

  return (
    <div className="print-container bg-white p-8 max-w-[210mm] mx-auto">
      <style jsx>{`
        @media print {
          .print-container {
            padding: 0;
            max-width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>

      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Electronic Health Record</h1>
        <div className="mt-2 text-sm text-gray-600">
          <p>Printed: {printDate}</p>
          <p>Record ID: {getEhrId(ehr)}</p>
        </div>
      </div>

      {/* Patient Information */}
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

      {/* General Medical Information */}
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
              <h3 className="font-semibold text-gray-800 mb-1">⚠️ Medical Alerts:</h3>
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

      {/* Diagnosis & Findings */}
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

      {/* Medications */}
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

      {/* Procedures */}
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
                    {proc.toothNumber}
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

      {/* Tooth Records */}
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
                    {tooth.toothNumber}
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

      {/* X-Rays */}
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

      {/* Clinical Notes & Recommendations */}
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

      {/* Footer */}
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

      {/* Print Button */}
      <div className="mt-6 text-center no-print">
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
        >
          Print EHR
        </button>
      </div>
    </div>
  );
}
