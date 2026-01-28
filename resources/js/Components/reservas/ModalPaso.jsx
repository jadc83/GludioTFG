import React from 'react';

export default function ModalPaso({ paso, pasoActual, onClose, children, maxWidth = 'max-w-sm' }) {
  if (pasoActual !== paso) return null;

  const alignmentClasses = paso === 2 ? 'pt-[40px] md:pt-[90px] items-start' : 'pt-[40px] md:pt-[60px] items-start';

  // Soporte especial para maxWidth="fit" que hace que el modal se ajuste al contenido
  const contenidoWidthClass = maxWidth === 'fit'
    ? 'w-auto inline-block max-w-[90%] md:max-w-[70%]'
    : `${maxWidth} md:max-w-2xl w-full`;

  // Usar clases Tailwind explícitas para que ganen sobre CSS local
  const wrapperClass = (paso === 3 || paso === 2)
    ? 'bg-transparent p-0'
    : 'bg-white p-4 rounded-lg';

  return (
    <div
      className={`fixed inset-0 bg-black/50 z-50 flex justify-center p-2 ${alignmentClasses}`}
      onClick={onClose}
    >
      <div
        className={`${wrapperClass} ${contenidoWidthClass} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
