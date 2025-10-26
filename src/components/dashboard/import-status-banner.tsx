'use client';
import React from 'react';
import { Loader2 } from 'lucide-react';

const ImportStatusBanner = () => {
  return (
    <div className="relative overflow-hidden p-[2px] rounded-xl transition-all duration-300">
      {/* Gradient border animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-500 to-sky-500 opacity-70 blur-md animate-pulse"></div>

      {/* Main content */}
      <div
        className={`relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl px-4 py-3 
        bg-blue-50/70 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 
        backdrop-blur-md border border-transparent shadow-sm`}
      >
        {/* Left section */}
        <div className="flex items-start gap-3">
          <Loader2 className="h-6 w-6 text-blue-500 dark:text-blue-400 animate-spin mt-1" />
          <div>
            <p className="font-semibold text-base">Import in Progress</p>
            <p className="text-sm opacity-90">
              We are importing your data. This may take a few hours. We’ll call you once it’s complete.  
              For now, you can explore your dashboard freely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportStatusBanner;
