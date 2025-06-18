import React, { useState, useRef, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form as UIForm } from './ui/form';
import { Button } from './ui/button';
import { SlidersHorizontal, ArrowUp, Paperclip, Ghost, Globe } from 'lucide-react';
import AutoResizeTextarea from './auto-resize-textarea';
import ImageUploadArea from './image-upload-area';
import { formSchema } from '../lib/form-schema';
import { cn } from '../lib/utils';
import PropTypes from 'prop-types';
import { MESSAGE_PLACEHOLDERS } from '../constants';
import ModelSelection from './ModelSelection';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '../hooks/use-mobile';
import ModelSelectionMobile from './ModelSelectionMobile';
import Tooltip from './Tooltip';
import toast from 'react-hot-toast';
import ToolsMenu from './ToolsMenu';
import { createPortal } from 'react-dom';

function MessageInput({ isLoading, onSubmit, onOpenOptions, onOpenTools, message, setMessage, selectedModel, setSelectedModel, isTemporaryChat, onStartTemporaryChat, useWebSearch, setUseWebSearch, messagesLeft, resetAt, user }) {
  const [previewFiles, setPreviewFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);
  const formRef = useRef(null);
  const dragCounter = useRef(0);
  const isMobile = useIsMobile();
  const inputRef = useRef(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
  const dropdownRef = useRef(null);
  const toggleButtonRef = useRef(null);
  const prevIsLoading = useRef(isLoading);
  const toolsDropdownRef = useRef(null);
  const toolsButtonRef = useRef(null);
  const [iconTooltip, setIconTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });

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
    const handler = () => {
      setShowOptions((prev) => !prev);
      if (typeof onOpenOptions === 'function') {
        onOpenOptions();
      }
    };
    window.addEventListener('select-model', handler);
    return () => window.removeEventListener('select-model', handler);
  }, [onOpenOptions]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  };

  const MAX_FILE_SIZE_MB = 5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const addFiles = useCallback((files) => {
    if (files.length === 0) return;
    const currentFiles = form.getValues('images') || [];
    const totalFiles = currentFiles.length + files.length;
    if (totalFiles > 5) {
      setError('You can upload a maximum of 5 files');
      toast.error('You can upload a maximum of 5 files');
      const allowedNewFiles = 5 - currentFiles.length;
      files = files.slice(0, allowedNewFiles);
      if (files.length === 0) return;
    }
    // Filter out files over 5MB
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE_BYTES);
    if (oversizedFiles.length > 0) {
      setError('Each file must be 5MB or less');
      toast.error('Each file must be 5MB or less');
      files = files.filter(file => file.size <= MAX_FILE_SIZE_BYTES);
      if (files.length === 0) return;
    }
    // Separate PDFs and images
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    // Only allow images if model supports them
    if (imageFiles.length > 0 && !(selectedModel && Array.isArray(selectedModel.capabilities) && (selectedModel.capabilities.includes('vision') || selectedModel.capabilities.includes('imagegen')))) {
      toast.error('This model does not support image attachments');
      // Only add PDFs
      files = pdfFiles;
      if (files.length === 0) return;
    }
    const newPreviewFiles = files.map((file) => {
      if (file.type === 'application/pdf') {
        return { type: 'pdf', file, name: file.name, size: file.size };
      } else if (file.type.startsWith('image/')) {
        return { type: 'image', file, url: URL.createObjectURL(file), name: file.name, size: file.size };
      }
      return null;
    }).filter(Boolean);
    const updatedFiles = [...currentFiles, ...files];
    setPreviewFiles([...previewFiles, ...newPreviewFiles]);
    form.setValue('images', updatedFiles);
  }, [form, previewFiles, MAX_FILE_SIZE_BYTES, selectedModel]);

  const removeFile = (index) => {
    const currentFiles = form.getValues('images') || [];
    const newFiles = [...currentFiles];
    newFiles.splice(index, 1);
    const newPreviewFiles = [...previewFiles];
    if (newPreviewFiles[index]?.type === 'image') {
      URL.revokeObjectURL(newPreviewFiles[index].url);
    }
    newPreviewFiles.splice(index, 1);
    setPreviewFiles(newPreviewFiles);
    form.setValue('images', newFiles);
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
        const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('image/') || file.type === 'application/pdf');
        addFiles(files);
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
  }, [addFiles]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const modelSupportsAttachments = selectedModel && Array.isArray(selectedModel.capabilities) && (selectedModel.capabilities.includes('vision') || selectedModel.capabilities.includes('imagegen'));

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

  // Add a handler to select model and close the selection after 0.2s
  const handleModelSelect = (model) => {
    setSelectedModel(model);
    const supportsAttachments = Array.isArray(model.capabilities) && (model.capabilities.includes('vision') || model.capabilities.includes('imagegen'));
    if (!supportsAttachments) {
      // Clear images and previews if switching to a model that does not support attachments
      setPreviewFiles([]);
      form.setValue('images', []);
    }
    setTimeout(() => {
      setShowOptions(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 200);
  };

  useEffect(() => {
    if (!showOptions || isMobile) return;
    const handleClickOutside = (event) => {
      if (
        (dropdownRef.current && dropdownRef.current.contains(event.target)) ||
        (toggleButtonRef.current && toggleButtonRef.current.contains(event.target))
      ) {
        return;
      }
      setShowOptions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOptions, isMobile]);

  useEffect(() => {
    if (prevIsLoading.current && !isLoading) {
      if (inputRef.current) inputRef.current.focus();
    }
    prevIsLoading.current = isLoading;
  }, [isLoading]);

  // Close tools selector on outside click
  useEffect(() => {
    if (!showTools || isMobile) return;
    const handleClickOutside = (event) => {
      if (
        (toolsDropdownRef.current && toolsDropdownRef.current.contains(event.target)) ||
        (toolsButtonRef.current && toolsButtonRef.current.contains(event.target))
      ) {
        return;
      }
      setShowTools(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTools, isMobile]);

  return (
    <UIForm {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(async (...args) => {
        if (inputRef.current) {
          inputRef.current.style.height = 'auto';
          inputRef.current.style.overflowY = 'hidden';
        }
        const data = args[0];
        const model = args[2] || selectedModel;
        const files = form.getValues('images') || [];
        let images = [];
        if (files.length > 0) {
          images = await Promise.all(files.map(async (file) => {
            return new Promise((resolve, reject) => {
              const reader = new window.FileReader();
              reader.onload = () => {
                resolve({
                  name: file.name,
                  type: file.type,
                  data: reader.result
                });
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          }));
        }
        setPreviewFiles([]);
        form.setValue('images', []);
        setMessage('');
        await onSubmit({ ...data, images }, ...args.slice(1), model);
      })}
        className={cn('relative', isMobile && 'fixed bottom-0 left-0 w-full z-30 p-2 pb-4', !isMobile && '')}
        style={isMobile ? { 
          boxShadow: '0 -2px 24px 0 rgba(0,0,0,0.25)',
          transformOrigin: 'bottom center'
        } : {}}>
        {/* Model info bar */}
        {selectedModel && (
          <div
            className={`flex items-center justify-start max-w-2xl mx-auto mb-1 px-2`}
            style={{
              minHeight: 28,
              borderRadius: 8,
              padding: '0.15rem 0.7rem',
              zIndex: 30,
            }}
          >
            <span
              className='flex items-center gap-2 bg-[#F9B4D0]/30 text-white px-2 py-0.5 rounded text-xs font-bold'
              style={{ fontSize: 14, fontWeight: 600, letterSpacing: 0.1 }}
            >
              {selectedModel.displayName}
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: '0.5rem' }}>
                {isTemporaryChat && (
                  <span
                    onMouseEnter={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setIconTooltip({ visible: true, x: rect.left + rect.width / 2, y: rect.top - 32, text: 'Temporary chat (messages are not saved)' });
                    }}
                    onMouseLeave={() => setIconTooltip(iconTooltip => ({ ...iconTooltip, visible: false }))}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <Ghost size={17} style={{ color: '#fff', opacity: 0.95 }} />
                  </span>
                )}
                {useWebSearch && (
                  <span
                    onMouseEnter={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setIconTooltip({ visible: true, x: rect.left + rect.width / 2, y: rect.top - 32, text: 'Web search enabled for this chat' });
                    }}
                    onMouseLeave={() => setIconTooltip(iconTooltip => ({ ...iconTooltip, visible: false }))}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <Globe size={17} style={{ color: '#fff', opacity: 0.95 }} />
                  </span>
                )}
              </span>
            </span>
          </div>
        )}
        {iconTooltip.visible && iconTooltip.text && createPortal(
          <Tooltip x={iconTooltip.x} y={iconTooltip.y} text={iconTooltip.text} />,
          document.body
        )}
        <div className={cn("relative max-w-2xl mx-auto message-input-container", isMobile && "flex flex-col-reverse")}>
          {/* Liquid glass border effect */}
          <div className="absolute inset-0 z-0 rounded-[24px] pointer-events-none border-2 border-white/60 bg-gradient-to-br from-white/10 via-white/5 to-white/0 backdrop-blur-2xl backdrop-brightness-125" style={{ boxShadow: '0 0 16px 2px rgba(255,255,255,0.10), 0 4px 32px 0 rgba(0,0,0,0.18)' }} />
          {/* Main glass content */}
          <div
            ref={dropAreaRef}
            className={cn(
              'relative z-10 bg-white/5 backdrop-blur-lg rounded-[24px] overflow-visible transition-all shadow-xl',
              isLoading && 'animate-pulse-loading pointer-events-none opacity-70',
              isMobile ? 'max-w-full rounded-2xl flex flex-col-reverse' : ''
            )}
            style={{ boxShadow: '0 0 12px 2px rgba(255,255,255,0.10)' }}
            onDragEnter={modelSupportsAttachments ? undefined : (e) => e.preventDefault()}
            onDragOver={modelSupportsAttachments ? undefined : (e) => e.preventDefault()}
            onDrop={modelSupportsAttachments ? undefined : (e) => e.preventDefault()}
          >
            <ImageUploadArea previewFiles={previewFiles} onRemoveFile={removeFile} isLoading={isLoading || !modelSupportsAttachments} />
            <div className='px-2 py-1.5'>
              <div className={cn('flex', isMobile ? 'items-end' : 'items-end')}>
                <div className='flex flex-row gap-x-2'>
                  <input
                    type='file'
                    ref={fileInputRef}
                    accept='image/*,application/pdf'
                    multiple
                    onChange={handleFileChange}
                    className='hidden'
                    disabled={isLoading}
                  />
                  <div
                    onMouseEnter={e => showTooltip(e, (selectedModel && Array.isArray(selectedModel.capabilities) && (selectedModel.capabilities.includes('vision') || selectedModel.capabilities.includes('imagegen')))
                      ? 'Add an image or PDF file'
                      : 'Add a PDF file (images not supported by this model)')}
                    onMouseLeave={hideTooltip}
                    style={{ display: 'inline-block' }}
                  >
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={triggerFileInput}
                      className='liquid-glass-circle-btn'
                      disabled={isLoading}
                    >
                      <Paperclip className='h-5 w-5' />
                    </Button>
                  </div>
                  <div className='relative'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      ref={toggleButtonRef}
                      onClick={() => {
                        setShowOptions((prev) => {
                          const next = !prev;
                          if (next) setShowTools(false);
                          if (typeof onOpenOptions === 'function') {
                            onOpenOptions(next);
                          }
                          return next;
                        });
                      }}
                      className='liquid-glass-circle-btn'
                      disabled={isLoading}
                      onMouseEnter={e => showTooltip(e, 'Model selection (Ctrl+M)')}
                      onMouseLeave={hideTooltip}
                      data-model-select-btn
                    >
                      <SlidersHorizontal className='h-5 w-5' />
                    </Button>
                    <AnimatePresence>
                      {showOptions && (
                        <motion.div
                          ref={dropdownRef}
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
                          onAnimationComplete={(def) => {
                            if (!showOptions && typeof onOpenOptions === 'function') {
                              onOpenOptions(false);
                            }
                          }}
                        >
                          <div className={isMobile ? 'max-h-[60vh] overflow-y-auto' : ''}>
                            {isMobile ? <ModelSelectionMobile selectedModel={selectedModel} onModelSelect={handleModelSelect} /> : <ModelSelection selectedModel={selectedModel} onModelSelect={handleModelSelect} />}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className='relative'>
                    <ToolsMenu
                      isLoading={isLoading}
                      isTemporaryChat={isTemporaryChat}
                      onStartTemporaryChat={onStartTemporaryChat}
                      isMobile={isMobile}
                      toolsDropdownRef={toolsDropdownRef}
                      toolsButtonRef={toolsButtonRef}
                      showTools={showTools}
                      setShowTools={(open) => {
                        setShowTools(open);
                        if (open) setShowOptions(false);
                        if (typeof onOpenTools === 'function') {
                          onOpenTools(open);
                        }
                      }}
                      showTooltip={showTooltip}
                      hideTooltip={hideTooltip}
                      useWebSearch={useWebSearch}
                      setUseWebSearch={setUseWebSearch}
                      onSelectModel={modelSlug => {
                        if (setSelectedModel) {
                          setSelectedModel({
                            ...selectedModel,
                            openRouterName: modelSlug,
                            name: modelSlug,
                            displayName: 'Web Search',
                            family: 'chatgpt',
                          });
                        }
                      }}
                    />
                  </div>
                </div>
                <AutoResizeTextarea
                  ref={inputRef}
                  placeholder={isMobile ? 'Type a message...' : randomPlaceholderRef.current}
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
                <p className='text-white font-medium tracking-normal text-lg'>Drop files here</p>
              </div>
            )}
          </div>
        </div>
        {error && <div className='mt-2 text-red-400 text-sm tracking-normal'>{error}</div>}
        {tooltip.visible && tooltip.text && !isMobile && (
          <Tooltip x={tooltip.x} y={tooltip.y - 36} text={tooltip.text} />
        )}
      </form>
    </UIForm>
  );
}

MessageInput.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onOpenOptions: PropTypes.func.isRequired,
  onOpenTools: PropTypes.func,
  message: PropTypes.string.isRequired,
  setMessage: PropTypes.func.isRequired,
  selectedModel: PropTypes.object.isRequired,
  setSelectedModel: PropTypes.func.isRequired,
  isTemporaryChat: PropTypes.bool,
  onStartTemporaryChat: PropTypes.func,
  useWebSearch: PropTypes.bool.isRequired,
  setUseWebSearch: PropTypes.func.isRequired,
  messagesLeft: PropTypes.number,
  resetAt: PropTypes.string,
  user: PropTypes.object,
};

export default MessageInput; 