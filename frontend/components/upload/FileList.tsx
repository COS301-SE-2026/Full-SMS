'use client';

import React from 'react';
import { SelectedFile } from '@/types/file';

interface FileListProps {
  files: SelectedFile[];
  onRemove?: (id: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0.0 MB';
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(1)} MB`;
};

const getFormattedCurrentDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export default function FileList({ files, onRemove }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-2">
      <div className="text-xs text-zinc-500 font-medium px-1 flex justify-between">
        <span>Staged Items</span>
        <span>{files.length} Total</span>
      </div>

      <div className="w-full rounded-lg border border-[#2a2a2a] bg-[#18181c]/80 p-3 shadow-2xl">
        <div className="border border-[#222226] bg-[#111114] rounded-[5px] overflow-hidden">
          <div className="divide-y divide-[#1f1f24] max-h-[380px] overflow-y-auto custom-scrollbar">
            {files.map((file) => {
              const isPending = file.status === 'pending';
              const isSuccess = file.status === 'success';
              const isError = file.status === 'error';

              return (
                <div
                  key={file.id}
                  className={`group relative px-5 py-3.5 flex items-center justify-between gap-6 transition-colors duration-150 ${
                    isPending 
                      ? 'bg-[#4fd1c5]/5' 
                      : 'hover:bg-[#1f1f24]/50'
                  }`}
                >
                  {/*Document Icon and filename description */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
            
                    <svg
                      className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                        isPending || isSuccess 
                          ? 'text-[#4fd1c5]' 
                          : isError 
                          ? 'text-red-400' 
                          : 'text-zinc-400 group-hover:text-zinc-300'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>

                    <div className="min-w-0 flex-1">
                      <p 
                        className={`text-[13.5px] font-normal tracking-wide truncate transition-colors ${
                          isPending || isSuccess 
                            ? 'text-[#4fd1c5]' 
                            : isError 
                            ? 'text-red-400/90' 
                            : 'text-zinc-300 group-hover:text-zinc-100'
                        }`}
                        title={file.name}
                      >
                        {file.name}
                      </p>
             
                      {(isPending || isError) && (
                        <div className="text-[11px] mt-0.5 font-medium tracking-wide">
                          {isPending && (
                            <span className="text-[#4fd1c5] animate-pulse">
                              Uploading ({file.progress}%)
                            </span>
                          )}
                          {isError && (
                            <span className="text-red-400/70 truncate block">
                              {file.errorMessage || 'Failed connection verification'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/*Size, timestamps and controls */}
                  <div className="flex items-center gap-8 flex-shrink-0 text-right font-mono text-[13px] text-zinc-400">
                    <span className="w-20 tracking-normal font-sans text-zinc-400 text-right">
                      {formatFileSize(file.sizeBytes)}
                    </span>
                    <span className="hidden sm:inline text-zinc-500 text-xs tracking-wider">
                      {getFormattedCurrentDate()}
                    </span>

                    {/* Action buttons on hover */}
                    <div className="w-6 flex items-center justify-end">
                      {isPending ? (
                        <svg className="animate-spin h-4 w-4 text-[#4fd1c5]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        onRemove && (
                          <button
                            onClick={() => onRemove(file.id)}
                            type="button"
                            className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-150 p-1 rounded hover:bg-zinc-900"
                            aria-label="Remove item"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}