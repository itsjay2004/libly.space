
import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react'; // Assuming Lucide React is available

interface ProgressBarProps {
  currentStep: number;
}

const ProgressBar = ({ currentStep }: ProgressBarProps) => {
  const steps = ['Library Details', 'Import Students', 'Ready!'];

  return (
    <div className="w-full py-4">
      <div className="flex justify-between items-center text-center">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'rounded-full h-10 w-10 flex items-center justify-center text-white text-lg font-semibold transition-colors duration-200',
                  currentStep > index + 1 ? 'bg-green-500' : (currentStep === index + 1 ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'), // Green for completed
                  currentStep === index + 1 && 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-950' // Highlight current step
                )}
              >
                {currentStep > index + 1 ? <Check className="h-5 w-5" /> : index + 1}
              </div>
              <div
                className={cn(
                  'text-sm mt-1 transition-colors duration-200',
                  currentStep >= index + 1 ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-700 mx-2 transition-colors duration-200">
                <div
                  className={cn(
                    'h-full transition-all duration-200',
                    currentStep > index + 1 ? 'bg-green-500 w-full' : (currentStep === index + 1 ? 'bg-primary w-1/2' : 'w-0') // Green for completed line
                  )}
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
