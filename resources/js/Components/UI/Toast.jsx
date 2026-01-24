import { useEffect, useState } from 'react';

export default function Toast({ message, tipo = 'info', duration = 4500, onClose }) {
  const [visible, setVisible] = useState(!!message);

  useEffect(() => {
    setVisible(!!message);
    if (!message) return;
    const t = setTimeout(() => {
      setVisible(false);
      if (typeof onClose === 'function') onClose();
    }, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!visible || !message) return null;

  const bg = tipo === 'error' ? 'bg-red-600' : 'bg-indigo-600';

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`${bg} text-white px-4 py-2 rounded shadow-lg flex items-center`}>
        <div className="mr-3">{message}</div>
        <button onClick={() => typeof onClose === 'function' && onClose()} className="text-white ml-2 opacity-90 hover:opacity-100 focus:outline-none" aria-label="Cerrar">×</button>
      </div>
    </div>
  );
}
