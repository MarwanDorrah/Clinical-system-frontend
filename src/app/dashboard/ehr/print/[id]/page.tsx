'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import PrintableEHR from '@/components/PrintableEHR';
import { ehrService, patientService, appointmentService } from '@/services';
import { EHR, Patient, Appointment } from '@/types/api.types';

export default function EHRPrintPage() {
  const params = useParams();
  const router = useRouter();
  const ehrId = Number(params.id);

  const [ehr, setEhr] = useState<EHR | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointment, setAppointment] = useState<Appointment | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isNaN(ehrId)) {
      router.push('/dashboard/ehr');
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const ehrData = await ehrService.getEHRById(ehrId) as EHR;
        setEhr(ehrData);
        if (ehrData.patient_ID) {
          const patientData = await patientService.getPatientById(ehrData.patient_ID.toString()) as Patient;
          setPatient(patientData);

          try {
            const appts = await appointmentService.getAppointmentsByPatient(ehrData.patient_ID) as Appointment[];
            if (appts && appts.length > 0) {
              
              const sorted = appts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              setAppointment(sorted[0]);
            }
          } catch (e) {
            
          }
        }
      } catch (e) {
        console.error('Error loading EHR for print', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [ehrId, router]);

  useEffect(() => {
    if (!loading && ehr && patient) {
      
      const t = setTimeout(() => {
        window.print();
      }, 250);
      return () => clearTimeout(t);
    }
  }, [loading, ehr, patient]);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!ehr || !patient) return (
    <div className="text-center py-12">
      <p className="text-gray-500">Unable to load EHR for printing.</p>
      <button className="mt-4 px-4 py-2 bg-gray-100 rounded" onClick={() => router.push(`/dashboard/ehr/${ehrId}`)}>Back</button>
    </div>
  );

  return (
    <div>
      <PrintableEHR ehr={ehr} patient={patient} appointment={appointment} />
    </div>
  );
}
