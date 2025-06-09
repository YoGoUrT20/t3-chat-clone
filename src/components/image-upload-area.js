import React from 'react';
import { X } from 'lucide-react';

function ImageUploadArea({ previewUrls, onRemoveImage, isLoading = false }) {
  if (!previewUrls || previewUrls.length === 0) {
    return null;
  }

  return (
    <div className='flex flex-wrap gap-2 px-4 pt-3 pointer-events-auto'>
      {previewUrls.map((url, index) => (
        <div key={index} className='relative h-16 w-16'>
          <img
            src={url || '/placeholder.svg'}
            alt={'Preview ' + (index + 1)}
            className='h-full w-full object-cover rounded-full'
          />
          {!isLoading && (
            <button type='button' onClick={() => onRemoveImage(index)} className='absolute -top-1 -right-1'>
              <X className='h-3 w-3 text-white' />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default ImageUploadArea; 