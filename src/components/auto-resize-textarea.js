import React, { useEffect, useRef, useCallback } from 'react';
import { Textarea } from './ui/textarea';
import { cn } from '../lib/utils';

function AutoResizeTextarea({ className, maxHeight = 160, ...props }, ref) {
  const textareaRef = useRef(null);
  const minHeightRef = useRef(null);

  // Combine the forwarded ref with our local ref
  const setRefs = (element) => {
    textareaRef.current = element;
    if (typeof ref === 'function') {
      ref(element);
    } else if (ref) {
      ref.current = element;
    }
  };

  const resizeTextarea = useCallback(() => {
    if (textareaRef.current) {
      const value = textareaRef.current.value;
      if (minHeightRef.current == null) {
        minHeightRef.current = parseInt(getComputedStyle(textareaRef.current).lineHeight);
      }
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.overflowY = 'hidden';
      if (!value) {
        textareaRef.current.style.height = minHeightRef.current + 'px';
      } else {
        const scrollHeight = textareaRef.current.scrollHeight;
        if (scrollHeight > maxHeight) {
          textareaRef.current.style.height = maxHeight + 'px';
          textareaRef.current.style.overflowY = 'auto';
        } else {
          textareaRef.current.style.height = scrollHeight + 'px';
          textareaRef.current.style.overflowY = 'hidden';
        }
      }
    }
  }, [maxHeight]);

  useEffect(() => {
    if (textareaRef.current) {
      minHeightRef.current = parseInt(getComputedStyle(textareaRef.current).lineHeight);
      resizeTextarea();
    }
  }, [resizeTextarea]);

  const handleInput = (e) => {
    resizeTextarea();
    if (props.onChange) {
      props.onChange(e);
    }
  };

  return (
    <Textarea
      {...props}
      ref={setRefs}
      onChange={handleInput}
      className={cn(
        'overflow-hidden min-h-[40px] focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none border-0 shadow-none focus:border-none focus:shadow-none hide-scrollbar',
        className,
      )}
      style={{ outline: 'none', boxShadow: 'none', maxHeight: maxHeight, ...props.style }}
      rows={1}
    />
  );
}

export default React.forwardRef(AutoResizeTextarea); 