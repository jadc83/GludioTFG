import React from 'react';

export default function ModalPaso({ paso, pasoActual, onClose, children, maxWidth = 'max-w-sm' }) {
  if (pasoActual !== paso) return null;

  const alignmentClasses = paso === 2 ? 'md:pt-[120px] md:items-start items-center' : 'pt-[40px] md:pt-[60px] items-start';

  // Soporte especial para maxWidth="fit" que hace que el modal se ajuste al contenido
  const contenidoWidthClass = maxWidth === 'fit'
    ? 'w-auto inline-block max-w-[90%] md:max-w-[70%]'
    : `${maxWidth} md:max-w-2xl w-full`;

  return (
    <div
      className={`fixed inset-0 bg-black/50 z-50 flex justify-center p-2 ${alignmentClasses}`}
      onClick={onClose}
    >
      <div
        className={`bg-${paso === 3 ? 'gris' : 'white'} rounded-lg ${contenidoWidthClass} max-h-[90vh] overflow-y-auto ${paso === 3 ? 'p-6' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
