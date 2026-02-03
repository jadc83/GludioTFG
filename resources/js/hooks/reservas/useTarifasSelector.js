import { useEffect, useMemo } from 'react';

export default function useTarifasSelector({ tarifas = [], seleccion = {}, onChange }) {
    const esDesayuno = (t) => {
        const nombre = String(t?.nombre || '').toLowerCase();
        const slug = String(t?.slug || '').toLowerCase();
        return nombre.includes('desayun') || slug.includes('desayun');
    };

    useEffect(() => {
        if (!onChange || tarifas.length === 0) return;
        const desayunoIds = tarifas.filter(esDesayuno).map((t) => t.id);
        if (desayunoIds.length === 0) return;

        let necesitaUpdate = false;
        const next = { ...seleccion };
        desayunoIds.forEach((id) => {
            if (!next[id]) {
                next[id] = true;
                necesitaUpdate = true;
            }
        });

        if (necesitaUpdate) {
            onChange(next);
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tarifasLista', { detail: tarifas }));
        }
    }, [tarifas, onChange]);

    // Auto-seleccionar tarifas gratuitas (valor === 0) para que estén incluidas aunque no se muestren
    useEffect(() => {
        if (!onChange || tarifas.length === 0) return;
        const gratisIds = tarifas
            .filter((t) => Number(t.valor ?? t.modificador_precio ?? 0) === 0)
            .map((t) => t.id);
        if (gratisIds.length === 0) return;

        let necesitaUpdate = false;
        const next = { ...seleccion };
        gratisIds.forEach((id) => {
            if (!next[id]) {
                next[id] = true;
                necesitaUpdate = true;
            }
        });

        if (necesitaUpdate) {
            onChange(next);
        }
    }, [tarifas, onChange]);

    function toggleTarifa(id) {
        const tarifa = tarifas.find((t) => t.id === id);
        if (tarifa && esDesayuno(tarifa)) return;

        const next = { ...seleccion, [id]: !seleccion[id] };
        if (onChange) onChange(next);
    }

    const ordenadas = useMemo(
        () => [
            ...tarifas.filter(esDesayuno),
            ...tarifas.filter((t) => !esDesayuno(t)),
        ],
        [tarifas],
    );

    const esReembolsable = (t) => {
        const nombre = String(t?.nombre || '').toLowerCase();
        const slug = String(t?.slug || '').toLowerCase();
        return nombre.includes('reembols') || slug.includes('reembols');
    };

    const esOfertaEspecial = (t) => {
        const nombre = String(t?.nombre || '').toLowerCase();
        const slug = String(t?.slug || '').toLowerCase();
        return (
            nombre.includes('ofert') ||
            nombre.includes('especial') ||
            slug.includes('ofert') ||
            slug.includes('especial')
        );
    };

    const ordenadasVisibles = useMemo(
        () =>
            ordenadas.filter((t) => {
                // Ocultar tarifas con valor 0 en el selector visual, pero seguir incluyéndolas en la selección
                const valor = Number(t.valor ?? t.modificador_precio ?? 0);
                if (valor === 0) return false;

                if (esDesayuno(t)) return true;
                if (esReembolsable(t)) return false;
                if (esOfertaEspecial(t)) return false;
                return true;
            }),
        [ordenadas],
    );

    function isChecked(t) {
        if (!t) return false;
        return esDesayuno(t) ? true : !!seleccion[t.id];
    }

    return {
        ordenadasVisibles,
        toggleTarifa,
        esDesayuno,
        isChecked,
    };
}
