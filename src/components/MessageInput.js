import React, { useState, useRef, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form as UIForm } from './ui/form';
import { Button } from './ui/button';
import { ImageIcon, SlidersHorizontal, ArrowUp } from 'lucide-react';
import AutoResizeTextarea from './auto-resize-textarea';
import ImageUploadArea from './image-upload-area';
import { formSchema } from '../lib/form-schema';
import { useMediaQuery } from '../hooks/use-media-query';
import { cn } from '../lib/utils';
import PropTypes from 'prop-types';
import { MESSAGE_PLACEHOLDERS } from '../constants';
import ModelSelection from './ModelSelection';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '../hooks/use-mobile';
import ModelSelectionMobile from './ModelSelectionMobile';

function MessageInput({ isLoading, onSubmit, onOpenOptions, message, setMessage }) {
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);
  const formRef = useRef(null);
  const dragCounter = useRef(0);
  const isMobile = useIsMobile();
  const inputRef = useRef(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });

  // Pick a random placeholder only once per mount
  const randomPlaceholderRef = useRef(MESSAGE_PLACEHOLDERS[Math.floor(Math.random() * MESSAGE_PLACEHOLDERS.length)]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: message || '',
      images: [],
      condition_mode: 'concat',
      quality: 'medium',
      geometry_file_format: 'glb',
      use_hyper: false,
      tier: 'Regular',
      TAPose: false,
      material: 'PBR',
    },
  });

  // Sync form value with message prop
  useEffect(() => {
    if (form.getValues('prompt') !== message) {
      form.setValue('prompt', message || '');
    }
  }, [message, form]);

  // When input changes, update both form and parent state
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    form.setValue('prompt', e.target.value);
  };

  useEffect(() => {
    if (!showOptions) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowOptions(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showOptions]);

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setShowOptions((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    addImages(files);
  };

  const addImages = useCallback((files) => {
    if (files.length === 0) return;
    const currentImages = form.getValues('images') || [];
    const totalImages = currentImages.length + files.length;
    if (totalImages > 5) {
      setError('You can upload a maximum of 5 images');
      const allowedNewImages = 5 - currentImages.length;
      files = files.slice(0, allowedNewImages);
      if (files.length === 0) return;
    }
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    const updatedImages = [...currentImages, ...files];
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    form.setValue('images', updatedImages);
  }, [form, previewUrls]);

  const removeImage = (index) => {
    const currentImages = form.getValues('images') || [];
    const newImages = [...currentImages];
    newImages.splice(index, 1);
    const newPreviewUrls = [...previewUrls];
    URL.revokeObjectURL(newPreviewUrls[index]);
    newPreviewUrls.splice(index, 1);
    setPreviewUrls(newPreviewUrls);
    form.setValue('images', newImages);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    const handleWindowDragEnter = (e) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.items).some(item => item.kind === 'file')) {
        dragCounter.current += 1;
        setIsDragging(true);
      }
    };
    const handleWindowDragLeave = (e) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.items).some(item => item.kind === 'file')) {
        dragCounter.current -= 1;
        if (dragCounter.current === 0) {
          setIsDragging(false);
        }
      }
    };
    const handleWindowDragOver = (e) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.items).some(item => item.kind === 'file')) {
        e.preventDefault();
      }
    };
    const handleWindowDrop = (e) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.items).some(item => item.kind === 'file')) {
        e.preventDefault();
        dragCounter.current = 0;
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('image/'));
        addImages(files);
      }
    };
    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [addImages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey) {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    }
  };

  const showTooltip = (e, text) => {
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top,
      text,
    });
  };
  const hideTooltip = () => {
    if (isMobile) return;
    setTooltip({ visible: false, x: 0, y: 0, text: '' });
  };

  return (
    <UIForm {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit((...args) => {
        if (inputRef.current) {
          inputRef.current.style.height = 'auto';
          inputRef.current.style.overflowY = 'hidden';
        }
        onSubmit(...args);
      })} 
        className={cn('relative', isMobile && 'fixed bottom-0 left-0 w-full z-30 bg-[#221D27] p-2 pb-4', !isMobile && '')}
        style={isMobile ? { boxShadow: '0 -2px 24px 0 rgba(0,0,0,0.25)' } : {}}>
        <div
          ref={dropAreaRef}
          className={cn(
            'relative bg-black/60 backdrop-blur-md rounded-[24px] overflow-visible transition-all shadow-lg border border-[rgba(255,255,255,0.12)] max-w-2xl mx-auto',
            isLoading && 'animate-pulse-loading pointer-events-none opacity-70',
            isMobile && 'max-w-full rounded-2xl'
          )}
        >
          <ImageUploadArea previewUrls={previewUrls} onRemoveImage={removeImage} isLoading={isLoading} />
          <div className='px-2 py-1.5'>
            <div className='flex items-end'>
              <div className='flex flex-row space-x-0'>
                <input
                  type='file'
                  ref={fileInputRef}
                  accept='image/*'
                  multiple
                  onChange={handleImageChange}
                  className='hidden'
                  disabled={isLoading}
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={triggerFileInput}
                  className='text-gray-400 hover:text-white hover:bg-transparent rounded-full h-10 w-10 ml-0'
                  disabled={isLoading}
                  onMouseEnter={e => showTooltip(e, 'Add image')}
                  onMouseLeave={hideTooltip}
                >
                  <ImageIcon className='h-5 w-5' />
                </Button>
                <div className='relative'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => {
                      setShowOptions((prev) => !prev);
                      onOpenOptions();
                    }}
                    className='text-gray-400 hover:text-white hover:bg-transparent rounded-full h-10 w-10 ml-0'
                    disabled={isLoading}
                    onMouseEnter={e => showTooltip(e, 'Model selection (Ctrl+M)')}
                    onMouseLeave={hideTooltip}
                  >
                    <SlidersHorizontal className='h-5 w-5' />
                  </Button>
                  <AnimatePresence>
                    {showOptions && (
                      <motion.div
                        key='ModelSelection-dropdown'
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        transition={{ type: 'tween', duration: 0.25 }}
                        className={cn(
                          isMobile
                            ? 'fixed left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-700 rounded-t-2xl shadow-lg text-white p-0'
                            : 'absolute mx-auto my-auto bottom-full bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-20 min-w-[600px] text-white',
                        )}
                        style={isMobile ? { bottom: 80, maxHeight: '60vh', overflow: 'visible' } : {}}
                      >
                        <div className={isMobile ? 'max-h-[60vh] overflow-y-auto' : ''}>
                          {isMobile ? <ModelSelectionMobile /> : <ModelSelection />}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <AutoResizeTextarea
                ref={inputRef}
                placeholder={randomPlaceholderRef.current}
                className="flex-1 bg-transparent border-0 focus:ring-0 text-white placeholder:text-gray-400 py-2 px-3 resize-none text-base tracking-normal"
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                maxHeight={160}
              />
              <div className='flex flex-col justify-end'>
                <Button
                  type='submit'
                  className='bg-white hover:bg-gray-200 text-black rounded-full h-10 w-10 p-0 flex items-center justify-center'
                  disabled={isLoading}
                >
                  <ArrowUp className='h-5 w-5' />
                </Button>
              </div>
            </div>
          </div>
          {isDragging && (
            <div className='absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-none z-10'>
              <p className='text-white font-medium tracking-normal text-lg'>Drop images here</p>
            </div>
          )}
        </div>
        {error && <div className='mt-2 text-red-400 text-sm tracking-normal'>{error}</div>}
        {tooltip.visible && tooltip.text && !isMobile && (
          <div
            style={{
              position: 'fixed',
              left: tooltip.x,
              top: tooltip.y - 36,
              transform: 'translateX(-50%)',
              zIndex: 50,
              pointerEvents: 'none',
            }}
            className='px-2 py-1 rounded bg-zinc-900 text-white text-xs shadow-lg border border-zinc-700 select-none'
          >
            {tooltip.text}
          </div>
        )}
      </form>
    </UIForm>
  );
}

MessageInput.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onOpenOptions: PropTypes.func.isRequired,
  message: PropTypes.string.isRequired,
  setMessage: PropTypes.func.isRequired,
};

export default MessageInput; 