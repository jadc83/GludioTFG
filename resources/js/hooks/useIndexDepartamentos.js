import { useEffect, useState } from 'react';

export default function useIndexDepartamentos() {
    const [departamentos, setDepartamentos] = useState([]);

    const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState(null);
    const [drawerAbierto, setDrawerAbierto] = useState(false);

    useEffect(() => {
        let mounted = true;
        fetch('/api/departamentos', { credentials: 'same-origin' })
            .then((r) => r.json())
            .then((data) => mounted && setDepartamentos(Array.isArray(data) ? data : []))
            .catch(() => mounted && setDepartamentos([]));

        return () => {
            mounted = false;
        };
    }, []);

    const abrirDetalle = (dep) => {
        setDepartamentoSeleccionado(dep);
        setDrawerAbierto(true);
    };

    const cerrarDetalle = () => {
        setDepartamentoSeleccionado(null);
        setDrawerAbierto(false);
    };

    // Sin paginación: devolver todos los departamentos
    const departamentosPaginados = departamentos;
    const inicio = departamentos.length > 0 ? 1 : 0;
    const fin = departamentos.length;
    const totalPaginas = 1;

    return {
        departamentos,
        departamentoSeleccionado,
        drawerAbierto,
        abrirDetalle,
        cerrarDetalle,
        departamentosPaginados,
        inicio,
        fin,
        totalPaginas,
    };
}
