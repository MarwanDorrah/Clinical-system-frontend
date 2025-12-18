'use client';

import { ChangeLog, EHR } from '@/types/api.types';
import { formatDateForDisplay, formatTimeForDisplay } from '@/utils/date.utils';
import { getEhrId } from '@/utils/ehr.utils';
import { Clock, User, FileText, Activity, Edit, Plus, Trash2 } from 'lucide-react';

interface EHRTimelineProps {
  changeLogs?: ChangeLog[];
  ehrRecords?: EHR[];
}

export default function EHRTimeline({ changeLogs = [], ehrRecords = [] }: EHRTimelineProps) {
  
  const timelineEvents = [
    ...changeLogs.map(log => ({
      id: `change-${log.changeLog_ID}`,
      type: 'change' as const,
      date: log.changedAt || '',
      time: log.changedAt ? new Date(log.changedAt).toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' }) : '',
      title: `${log.changeType}: ${log.fieldName}`,
      description: log.oldValue && log.newValue 
        ? `Changed from "${log.oldValue}" to "${log.newValue}"`
        : log.newValue 
        ? `Added "${log.newValue}"`
        : 'Field updated',
      user: log.changedByDoctorName,
      icon: log.changeType === 'Added' ? Plus : log.changeType === 'Deleted' ? Trash2 : Edit,
      color: log.changeType === 'Added' ? 'text-green-600' : log.changeType === 'Deleted' ? 'text-red-600' : 'text-blue-600',
      bgColor: log.changeType === 'Added' ? 'bg-green-50' : log.changeType === 'Deleted' ? 'bg-red-50' : 'bg-blue-50',
      borderColor: log.changeType === 'Added' ? 'border-green-300' : log.changeType === 'Deleted' ? 'border-red-300' : 'border-blue-300',
    })),
    ...ehrRecords.map(ehr => ({
      id: `ehr-${getEhrId(ehr)}`,
      type: 'ehr' as const,
      date: ehr.updatedAt || '',
      time: ehr.updatedAt ? new Date(ehr.updatedAt).toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' }) : '',
      title: 'Health Record Updated',
      description: ehr.diagnosis || ehr.clinicalNotes || 'EHR record modified',
      user: ehr.updatedBy,
      icon: FileText,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-300',
      ehrData: ehr,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (timelineEvents.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 text-lg font-medium">No timeline events yet</p>
        <p className="text-gray-400 text-sm mt-1">Patient history will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-primary-600" />
          <h3 className="text-lg font-bold text-gray-900">Patient Timeline</h3>
          <span className="text-sm text-gray-500">({timelineEvents.length} events)</span>
        </div>
      </div>

      {}
      <div className="relative">
        {}
        <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {}
        <div className="space-y-6">
          {timelineEvents.map((event, index) => {
            const Icon = event.icon;
            const isToday = new Date(event.date).toDateString() === new Date().toDateString();
            
            return (
              <div key={event.id} className="relative flex gap-4">
                {}
                <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white ${event.bgColor}`}>
                  <Icon className={`w-5 h-5 ${event.color}`} />
                </div>

                {}
                <div className={`flex-1 rounded-lg border-2 ${event.borderColor} ${event.bgColor} p-4 shadow-sm hover:shadow-md transition-shadow`}>
                  {}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className={`font-semibold ${event.color} text-base`}>
                        {event.title}
                      </h4>
                      <p className="text-sm text-gray-700 mt-1">
                        {event.description.length > 150 
                          ? `${event.description.substring(0, 150)}...` 
                          : event.description}
                      </p>
                    </div>
                    {isToday && (
                      <span className="ml-2 px-2 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full">
                        Today
                      </span>
                    )}
                  </div>

                  {}
                  {event.type === 'ehr' && event.ehrData && (
                    <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs">
                      {event.ehrData.medications && event.ehrData.medications.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Medications:</span>{' '}
                          <span className="text-gray-600">{event.ehrData.medications.length} active</span>
                        </div>
                      )}
                      {event.ehrData.procedures && event.ehrData.procedures.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Procedures:</span>{' '}
                          <span className="text-gray-600">{event.ehrData.procedures.length} recorded</span>
                        </div>
                      )}
                      {event.ehrData.teeth && event.ehrData.teeth.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Teeth:</span>{' '}
                          <span className="text-gray-600">{event.ehrData.teeth.length} documented</span>
                        </div>
                      )}
                      {event.ehrData.xRays && event.ehrData.xRays.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">X-Rays:</span>{' '}
                          <span className="text-gray-600">{event.ehrData.xRays.length} images</span>
                        </div>
                      )}
                    </div>
                  )}

                  {}
                  <div className="flex items-center space-x-4 mt-3 text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <User className="w-3.5 h-3.5" />
                      <span>{event.user}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDateForDisplay(event.date)} at {event.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
