
import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentStep: number;
}

const ProgressBar = ({ currentStep }: ProgressBarProps) => {
  const steps = ['Library Details', 'Import Students', 'Ready!'];

  return (
    <div className="w-full py-4">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex items-center">
              <div
                className={cn(
                  'rounded-full h-8 w-8 flex items-center justify-center text-white',
                  currentStep > index + 1 ? 'bg-green-500' : 'bg-primary'
                )}
              >
                {currentStep > index + 1 ? '✔' : index + 1}
              </div>
              <div className="ml-2">{step}</div>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 bg-gray-300 mx-4">
                <div
                  className={cn(
                    'h-1',
                    currentStep > index + 1 ? 'bg-green-500' : 'bg-primary'
                  )}
                  style={{ width: `${currentStep > index + 1 ? 100 : (currentStep === index + 1 ? 50 : 0)}%` }}
                ></div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
