'use client';

import React from 'react';
import { Activity } from 'lucide-react';
import PatientDataEntry from './PatientDataEntry';
import FormEntry from './FormEntry';

const DualEntryApp = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="container mx-auto p-6">
        {/* Main Header */}
        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-5 rounded-3xl blur-3xl"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl shadow-xl">
                <Activity className="h-12 w-12 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  RE-Assist
                </h1>
                <p className="text-slate-600 text-xl font-medium mt-1">
                  Intelligent Document Processing Platform
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-8xl mx-auto">
          {/* Patient Data Entry Column */}
          <PatientDataEntry />

          {/* Form Entry Column */}
          <FormEntry />
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-400 text-sm">
          <p>© 2025 RE-Assist. Powered by advanced AI technology.</p>
        </div>
      </div>
    </div>
  );
};

export default DualEntryApp;