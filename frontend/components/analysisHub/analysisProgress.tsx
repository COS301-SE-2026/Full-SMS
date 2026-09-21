import React from 'react';

interface ProgressBarProps {
    readonly totalMeasurements: number,
    readonly measurementsLeft: number
}

export function AnalysisProgress({totalMeasurements, measurementsLeft}: ProgressBarProps){

  const clampedProgress = measurementsLeft/totalMeasurements

  return (
    <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700 overflow-hidden">
      <div
        className={`bg-primary h-full text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full transition-all duration-300 ease-out`}
        style={{ width: `${clampedProgress}%` }}
      >
        {clampedProgress}%
      </div>
    </div>
  );
};
