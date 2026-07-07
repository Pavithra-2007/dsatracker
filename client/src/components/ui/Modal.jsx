import { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full ${sizes[size]} bg-gray-900 border border-gray-800
                       rounded-2xl shadow-2xl max-h-[90vh] flex flex-col`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>

      </div>
    </div>
  );
};

export default Modal;