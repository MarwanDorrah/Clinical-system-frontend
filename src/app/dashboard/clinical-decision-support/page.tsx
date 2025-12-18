'use client';

import { useState } from 'react';
import { Brain, ExternalLink, AlertCircle } from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function ClinicalDecisionSupportPage() {
  const [isLoading, setIsLoading] = useState(true);
  const externalUrl = 'https://dental-clinical-decision-support-sy.vercel.app/';

  const handleOpenInNewTab = () => {
    window.open(externalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="h-full flex flex-col">
      {}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clinical Decision Support</h1>
            <p className="text-gray-600 mt-1">Dental clinical decision support system</p>
          </div>
        </div>
        <Button
          onClick={handleOpenInNewTab}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Open in New Tab
        </Button>
      </div>

      {}
      <Card className="border-purple-200 bg-purple-50 mb-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-purple-900">
            <p className="font-medium mb-1">About Clinical Decision Support</p>
            <p className="text-purple-700">
              This tool provides evidence-based clinical guidance to assist in diagnosis, treatment planning, 
              and patient care decisions. Use it as a reference tool to complement your clinical expertise.
            </p>
          </div>
        </div>
      </Card>

      {}
      <div
        className="flex-1 relative rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm"
        style={{ minHeight: '1200px', height: 'calc(100vh - 180px)' }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Clinical Decision Support System...</p>
            </div>
          </div>
        )}
        <iframe
          src={externalUrl}
          className="w-full h-full min-h-[1200px] border-0"
          title="Clinical Decision Support System"
          onLoad={() => setIsLoading(false)}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
