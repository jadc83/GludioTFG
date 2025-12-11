import { useState, useCallback, useMemo, useEffect } from 'react';
import { router } from '@inertiajs/react';

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export function useReservaFiltros(reservas = [], conteos = {}) {
    const [filtros, setFiltros] = useState({
        status: 'todos',
        localizador: '',
        cliente: '',
        habitacion: '',
        notas: ''
    });

    const actualizarFiltro = useCallback((campo, valor) => {
        setFiltros(prev => ({ ...prev, [campo]: valor }));
    }, []);

    const debouncedLocalizador = useDebounce(filtros.localizador, 500);
    const debouncedCliente = useDebounce(filtros.cliente, 500);
    const debouncedHabitacion = useDebounce(filtros.habitacion, 500);
    const debouncedNotas = useDebounce(filtros.notas, 500);

    useEffect(() => {
        router.get(route('panel'), {
            status: filtros.status !== 'todos' ? filtros.status : undefined,
            localizador: debouncedLocalizador || undefined,
            cliente: debouncedCliente || undefined,
            habitacion: debouncedHabitacion || undefined,
            notas: debouncedNotas || undefined
        }, {
            preserveState: true,
            preserveScroll: true,
            only: ['reservas', 'reservasConteos'],
            replace: true
        });
    }, [filtros.status, debouncedLocalizador, debouncedCliente, debouncedHabitacion, debouncedNotas]);

    const aplicarFiltros = () => {
        router.get(route('panel'), {
            status: filtros.status !== 'todos' ? filtros.status : undefined,
            localizador: filtros.localizador || undefined,
            cliente: filtros.cliente || undefined,
            habitacion: filtros.habitacion || undefined,
            notas: filtros.notas || undefined
        }, {
            preserveState: true,
            preserveScroll: true,
            only: ['reservas', 'reservasConteos']
        });
    };

    const limpiarFiltros = useCallback(() => {
        setFiltros({ status: 'todos', localizador: '', cliente: '', habitacion: '', notas: '' });

        router.get(route('panel'), {}, {
            preserveState: true,
            preserveScroll: true,
            only: ['reservas', 'reservasConteos']
        });
    }, []);

    const hayFiltrosActivos = useMemo(() => {
        return Object.values(filtros).some(valor =>
            valor !== 'todos' && valor !== ''
        );
    }, [filtros]);

    return {
        filtros,
        actualizarFiltro,
        registrosFiltrados: reservas,
        limpiarFiltros,
        aplicarFiltros,
        hayFiltrosActivos,
        totalFiltrados: reservas.length,
        totalOriginal: conteos.total || reservas.length,
        conteos
    };
}
