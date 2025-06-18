import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';

function ImagePreviewDialog({ previewImage, previewImageAlt, setPreviewImage, setPreviewImageAlt }) {
  return (
    <DialogPrimitive.Root open={!!previewImage} onOpenChange={open => { if (!open) { setPreviewImage(null); setPreviewImageAlt(''); } }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0' />
        <AnimatePresence>
          {!!previewImage && (
            <DialogPrimitive.Content forceMount asChild>
              <div className='fixed inset-0 z-50 flex items-center justify-center pointer-events-auto' style={{ padding: 0, margin: 0 }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className='flex flex-col items-center justify-center w-full h-full pointer-events-none'
                  style={{ background: 'transparent', boxShadow: 'none', border: 'none', padding: 0, margin: 0 }}
                >
                  <img src={previewImage} alt={previewImageAlt} style={{ maxWidth: '96vw', maxHeight: '96vh', borderRadius: 0, border: 'none', background: 'transparent', pointerEvents: 'auto' }} />
                </motion.div>
              </div>
            </DialogPrimitive.Content>
          )}
        </AnimatePresence>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default ImagePreviewDialog; 