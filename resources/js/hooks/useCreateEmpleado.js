import { useEffect, useState } from 'react';
import { fetchRoles, fetchDepartamentos } from '@/services/empleadoService';
import { useFormGenerico } from '@/hooks/useFormGenerico';

const INITIAL_DATA = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',

    departamento: '',
    role: '',
    tipo_documento: 'dni',
    numero_documento: '',
    nacionalidad: '',
    direccion: '',
    ciudad: '',
    codigo_postal: '',
    telefono: '',
};

export default function useCreateEmpleado({ onSuccess } = {}) {
    const [roles, setRoles] = useState([]);
    const [departamentos, setDepartamentos] = useState([]);

    const [abierto, setAbierto] = useState(false);
    const [tabActiva, setTabActiva] = useState('personal');

    const {
        formulario,
        cambiar,
        errores,
        estaCargando,
        guardar: enviar,
        limpiar,
    } = useFormGenerico(INITIAL_DATA, '/empleados', '', () => {
        setAbierto(false);
        limpiar();
        setTabActiva('personal');
        if (onSuccess) onSuccess();
    });

    useEffect(() => {
        let mounted = true;
        fetchRoles().then((data) => mounted && setRoles((data || []).filter((r) => !['admin','user'].includes((r || '').toString().trim().toLowerCase())))).catch(()=>{});
        fetchDepartamentos().then((data) => mounted && setDepartamentos(Array.isArray(data) ? data : [])).catch(()=>{});
        return () => (mounted = false);
    }, []);

    const abrir = () => setAbierto(true);
    const cerrar = () => {
        setAbierto(false);
        limpiar();
        setTabActiva('personal');
    };

    const tieneErrores = (campos) => campos.some((campo) => !!errores[campo]);

    const getTabClass = (id, campos) => {
        const esActiva = tabActiva === id;
        const conError = tieneErrores(campos);
        let base =
            'flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all duration-200 ';

        if (conError) {
            return (
                base +
                (esActiva
                    ? 'text-red-600 border-red-600 bg-red-50'
                    : 'text-red-400 border-transparent hover:text-red-500')
            );
        }
        return (
            base +
            (esActiva
                ? 'text-[#7a0202] border-[#7a0202] bg-red-50/30'
                : 'text-gray-400 border-transparent hover:text-gray-900 hover:bg-gray-50')
        );
    };

    return {
        roles,
        departamentos,
        abierto,
        abrir,
        cerrar,
        tabActiva,
        setTabActiva,
        formulario,
        cambiar,
        errores,
        estaCargando,
        enviar,
        limpiar,
        tieneErrores,
        getTabClass,
    };
}
