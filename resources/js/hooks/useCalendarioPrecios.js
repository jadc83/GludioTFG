import { useState, useEffect, useCallback } from 'react';

export default function useCalendarioPrecios() {
  const [preciosPorDia, setPreciosPorDia] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const detectarMobile = () => setIsMobile(window.innerWidth <= 768);
    detectarMobile();
    window.addEventListener('resize', detectarMobile);
    return () => window.removeEventListener('resize', detectarMobile);
  }, []);

  const formatISO = useCallback((date) => {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const consultaPrecios = useCallback(async (startISO, endISO) => {
    if (!startISO || !endISO) return false;
    try {

      const res = await fetch(`/reservas/precios-por-dia?inicio=${startISO}&fin=${endISO}`);
      const json = await res.json();
      if (json && json.success && json.data) {
        // Merge incoming data with existing map to avoid wiping previously loaded months
        setPreciosPorDia((prev) => ({ ...(prev || {}), ...(json.data || {}) }));
        return true;
      }
      return false;

    } catch (e) {
      console.error('Error cargando precios por día', e);
      return false;
    }
  }, []);

  const obtenerPrecio = (iso) => {
    if (!iso) return undefined;
    return preciosPorDia[iso];
  };

  const formatearISO = formatISO;
  const esMobile = isMobile;

  return { preciosPorDia, consultaPrecios, obtenerPrecio, formatearISO, esMobile };
}
