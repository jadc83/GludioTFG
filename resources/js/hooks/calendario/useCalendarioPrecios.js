import { useState, useEffect, useCallback } from 'react';
import { formatearFecha } from '@/utils/fecha';
import { fetchPreciosPorDia } from './service';

export default function useCalendarioPrecios() {
  const [preciosPorDia, setPreciosPorDia] = useState({});
  const [esMobile, setIsMobile] = useState(false);

  useEffect(() => {

    const detectarMobile = () => setIsMobile(window.innerWidth <= 768);
    detectarMobile();
    window.addEventListener('resize', detectarMobile);
    return () => window.removeEventListener('resize', detectarMobile);

  }, []);

  const formatearISO = useCallback((date) => formatearFecha(date), []);

  const consultaPrecios = useCallback(async (inicio, fin) => {

    if (!inicio || !fin) return false;

    try {

      const json = await fetchPreciosPorDia(inicio, fin);

      if (json && json.success && json.data) {
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

  return { preciosPorDia, consultaPrecios, obtenerPrecio, formatearISO, esMobile };
}
