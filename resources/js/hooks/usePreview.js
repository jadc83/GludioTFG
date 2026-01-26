import { useState, useCallback } from 'react';
import * as api from '@/api/reservas';

export default function usePreview(localizador) {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchPreview = useCallback(async (checkInStr, checkOutStr) => {
        try {
            setError(null);
            setLoading(true);
            const res = await api.previewModificarEstancia(localizador, { check_in: checkInStr, check_out: checkOutStr });
            setPreview(res ?? null);
            return res ?? null;
        } catch (err) {
            setPreview(null);
            setError(err);
            return null;
        } finally {
            setLoading(false);
        }
    }, [localizador]);

    return { preview, loading, error, fetchPreview };
}
