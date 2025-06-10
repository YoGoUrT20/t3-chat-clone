import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';

function ImageUploadArea({ previewFiles, onRemoveFile, isLoading = false }) {
  const [tooltipIndex, setTooltipIndex] = useState(null);
  if (!previewFiles || previewFiles.length === 0) {
    return null;
  }

  return (
    <div className='flex flex-wrap gap-2 px-4 pt-3 pointer-events-auto'>
      {previewFiles.map((item, index) => (
        <div key={index} className='relative h-16 w-16 flex items-center justify-center'>
          {item.type === 'image' ? (
            <img
              src={item.url || '/placeholder.svg'}
              alt={item.name || 'Preview ' + (index + 1)}
              className='h-full w-full object-cover rounded-full'
            />
          ) : (
            <div
              className='flex flex-col items-center justify-center h-full w-full bg-zinc-900 rounded-full border border-zinc-700 cursor-pointer relative'
              onMouseEnter={() => setTooltipIndex(index)}
              onMouseLeave={() => setTooltipIndex(null)}
            >
              <FileText className='h-8 w-8 text-red-400' />
              <span className='text-xs text-white truncate w-full text-center' style={{marginTop: 0}}>PDF</span>
              {tooltipIndex === index && (
                <div
                  className='absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 rounded bg-zinc-900 text-white text-xs shadow-lg border border-zinc-700 select-none whitespace-nowrap'
                  style={{ pointerEvents: 'none' }}
                >
                  {item.name} <br />{(item.size / 1024).toFixed(1)} KB
                </div>
              )}
            </div>
          )}
          {!isLoading && (
            <button type='button' onClick={() => onRemoveFile(index)} className='absolute -top-1 -right-1'>
              <X className='h-3 w-3 text-white' />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default ImageUploadArea; 