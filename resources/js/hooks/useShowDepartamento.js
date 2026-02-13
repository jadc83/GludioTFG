import { useEffect, useMemo, useState } from 'react';
import { Inertia } from '@inertiajs/inertia';

export default function useShowDepartamento({ departamento, abierto } = {}) {
    const [detalleDepartamento, setDetalleDepartamento] = useState(null);

    useEffect(() => {
        let mounted = true;
        if (departamento && abierto) {
            fetch(`/api/departamentos/${departamento.id}`, { credentials: 'same-origin' })
                .then((r) => r.json())
                .then((data) => mounted && setDetalleDepartamento(data))
                .catch(() => mounted && setDetalleDepartamento(null));
        } else {
            setDetalleDepartamento(null);
        }
        return () => {
            mounted = false;
        };
    }, [departamento, abierto]);

    const abrirPerfilEmpleado = (empleado) => {
        const userId = empleado?.user_id || empleado?.userId || empleado?.user?.id;
        if (!userId) return;
        Inertia.get('/profile', { user_id: userId });
    };

    const obtenerEncargado = (listaEmpleados = []) => {
        if (!Array.isArray(listaEmpleados)) return null;
        return (
            listaEmpleados.find((e) => (e.role || '').toLowerCase() === 'encargado') ||
            listaEmpleados.find((e) => (Array.isArray(e.roles) && e.roles.includes('encargado'))) ||
            null
        );
    };

    const separarPorRoles = (listaEmpleados = []) => {
        const operarios = [];
        const auxiliares = [];
        (listaEmpleados || []).forEach((e) => {
            const rol = (e.role || '').toString().toLowerCase();
            const rolesArr = Array.isArray(e.roles) ? e.roles.map((r) => r.toString().toLowerCase()) : [];
            if (rol === 'operario' || rolesArr.includes('operario')) {
                operarios.push(e);
            } else if (rol === 'auxiliar' || rolesArr.includes('auxiliar')) {
                auxiliares.push(e);
            }
        });
        return { operarios, auxiliares };
    };

    const encargado = obtenerEncargado(detalleDepartamento?.empleados || []);
    const { operarios, auxiliares } = separarPorRoles(detalleDepartamento?.empleados || []);

    return {
        detalleDepartamento,
        abrirPerfilEmpleado,
        encargado,
        operarios,
        auxiliares,
    };
}
