import { useState, useEffect, useCallback } from 'react';
import { formatearFecha } from '@/utils/fecha';

export default function useCalendarioPrecios() {
  const [preciosPorDia, setPreciosPorDia] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const detectarMobile = () => setIsMobile(window.innerWidth <= 768);
    detectarMobile();
    window.addEventListener('resize', detectarMobile);
    return () => window.removeEventListener('resize', detectarMobile);
  }, []);

  const formatISO = useCallback((date) => formatearFecha(date), []);
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
