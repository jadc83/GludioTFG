import { formatearFecha } from '@/utils/fecha';
import { useCallback, useEffect, useState } from 'react';
import { fetchPreciosPorDia } from './service';

/**
 * Hook personalizado para gestión de precios en calendario
 * Maneja carga de precios por día, detección de mobile y formateo de fechas
 * Usado por: componentes de calendario de reserva
 * Retorna: objeto con precios, funciones de consulta y utilidades
 */
export default function useCalendarioPrecios() {
    const [preciosPorDia, setPreciosPorDia] = useState({});
    const [esMobile, setIsMobile] = useState(false);

    /**
     * Detecta si el dispositivo es móvil basado en ancho de pantalla
     * Actualiza estado automáticamente al cambiar tamaño de ventana
     */
    useEffect(() => {
        const detectarMobile = () => setIsMobile(window.innerWidth <= 768);
        detectarMobile();
        window.addEventListener('resize', detectarMobile);
        return () => window.removeEventListener('resize', detectarMobile);
    }, []);

    /**
     * Formatea fecha a formato ISO usando utilidad compartida
     * Memoizado para evitar recreaciones innecesarias
     * Retorna: string en formato YYYY-MM-DD
     */
    const formatearISO = useCallback((date) => formatearFecha(date), []);

    /**
     * Consulta precios por día desde API backend
     * Actualiza estado global de precios y maneja errores
     * Parámetros: inicio, fin (fechas en formato ISO)
     * Retorna: boolean indicando éxito de la consulta
     */
    const consultaPrecios = useCallback(async (inicio, fin) => {
        if (!inicio || !fin) return false;

        try {
            const json = await fetchPreciosPorDia(inicio, fin);

            if (json && json.success && json.data) {
                setPreciosPorDia((prev) => ({
                    ...(prev || {}),
                    ...(json.data || {}),
                }));
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }, []);

    /**
     * Obtiene precio para una fecha específica del estado cacheado
     * Retorna precio o undefined si no existe
     */
    const obtenerPrecio = (iso) => {
        if (!iso) return undefined;
        return preciosPorDia[iso];
    };

    return {
        preciosPorDia,
        consultaPrecios,
        obtenerPrecio,
        formatearISO,
        esMobile,
    };
}
