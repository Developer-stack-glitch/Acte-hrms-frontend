import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const Tooltip = ({ children, text, position = 'top' }) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      let top = 0;
      let left = 0;

      if (position === 'top') {
        top = rect.top + scrollY - 10;
        left = rect.left + scrollX + rect.width / 2;
      } else if (position === 'bottom') {
        top = rect.bottom + scrollY + 10;
        left = rect.left + scrollX + rect.width / 2;
      } else if (position === 'left') {
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - 10;
      } else if (position === 'right') {
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + 10;
      }

      setCoords({ top, left });
    }
  };

  useEffect(() => {
    if (show) {
      updateCoords();
      const interval = setInterval(updateCoords, 100); // Poll for scroll/layout changes
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
      return () => {
        clearInterval(interval);
        window.removeEventListener('scroll', updateCoords, true);
        window.removeEventListener('resize', updateCoords);
      };
    }
  }, [show]);

  const positions = {
    top: '-translate-x-1/2 -translate-y-full mb-2',
    bottom: '-translate-x-1/2 mt-2',
    left: '-translate-x-full -translate-y-1/2 mr-2',
    right: '-translate-y-1/2 ml-2'
  };

  const arrowPositions = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-y-transparent border-l-transparent'
  };

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-block"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {createPortal(
        <AnimatePresence>
          {show && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 4 : -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: position === 'top' ? 4 : -4 }}
              transition={{ duration: 0.1, ease: "easeOut" }}
              style={{
                top: coords.top,
                left: coords.left,
                position: 'absolute'
              }}
              className={`z-[9999999] px-3 py-1.5 bg-gray-900 text-white text-[11px] font-medium rounded-md shadow-2xl whitespace-nowrap pointer-events-none drop-shadow-md ${positions[position]}`}
            >
              {text}
              <div className={`absolute border-4 ${arrowPositions[position]}`} />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default Tooltip;
