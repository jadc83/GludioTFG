import { useRef, useState } from 'react';
import { useFormGenerico } from '@/hooks/useFormGenerico';
import { TIPOS_HABITACION } from '@/utils/constantes';
import habitacionesService from '@/services/habitacionesService';
import { Inertia } from '@inertiajs/inertia';

const DATOS_INICIALES = {
    numero: '',
    tipo: 'doble',
    capacidad: 2,
    estado: 'disponible',
    descripcion: '',
    notas: '',
};

export default function useCreateHabitacion({ onSuccess } = {}) {
    const [abierto, setAbierto] = useState(false);
    const [tabActiva, setTabActiva] = useState('info');

    const {
        formulario,
        cambiar,
        errores,
        estaCargando,
        setData,
        guardar,
        limpiar,
    } = useFormGenerico(DATOS_INICIALES, '/habitaciones', '', () => {
        setAbierto(false);
        limpiar();
        setTabActiva('info');
        if (onSuccess) onSuccess();
    });

    const MAX_FOTOS = 4;
    const [fotosNuevas, setFotosNuevas] = useState([]);
    const [fotosGuardadas, setFotosGuardadas] = useState([]);
    const [, setFotosAEliminar] = useState([]);

    const previsualizaciones = [
        ...fotosGuardadas.map((f) => f.url),
        ...fotosNuevas.map((f) => URL.createObjectURL(f)),
    ];

    const agregarFotos = (e) => {
        const cupoDisp = MAX_FOTOS - (fotosGuardadas.length + fotosNuevas.length);
        const nuevosArchivos = Array.from(e.target.files).slice(0, cupoDisp);
        setFotosNuevas((prev) => [...prev, ...nuevosArchivos]);
        e.target.value = '';
    };

    const quitarFoto = (idx) => {
        if (idx < fotosGuardadas.length) {
            const foto = fotosGuardadas[idx];
            if (foto.id) setFotosAEliminar((prev) => [...prev, foto.id]);
            setFotosGuardadas((prev) => prev.filter((_, i) => i !== idx));
        } else {
            setFotosNuevas((prev) => prev.filter((_, i) => i !== idx - fotosGuardadas.length));
        }
    };

    const enviar = async (e) => {
        e?.preventDefault?.();
        // Construir FormData y enviarlo con axios (igual que edit flow)
        try {
            const fd = new FormData();
            // Añadir campos del formulario
            Object.keys(DATOS_INICIALES).forEach((key) => {
                if (typeof formulario[key] !== 'undefined') {
                    fd.append(key, formulario[key]);
                }
            });
            fotosNuevas.forEach((file) => fd.append('fotos[]', file));

            // Llamada al servicio específico que maneja multipart/form-data
            const res = await habitacionesService.createHabitacionFormData(fd);

            // Si todo ok, limpieza y notificación mínima
            limpiar();
            setAbierto(false);
            setTabActiva('info');
            window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Habitación creada', type: 'success' } }));
            try { Inertia.reload(); } catch (err) { /* no bloquear */ }
            if (onSuccess) onSuccess(res);
        } catch (err) {
            const resp = err || {};
            // Propagar errores al formulario si vienen en formato { errors }
            if (resp.errors) {
                // useFormGenerico maneja errores locales; si se requiere, podríamos setearlos aquí
            }
            window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: resp.error || 'Error al crear habitación', type: 'error' } }));
        }
    };

    const abrir = () => setAbierto(true);
    const cerrar = () => {
        setAbierto(false);
        limpiar();
        setTabActiva('info');
    };

    const tieneErrores = (campos) => campos.some((campo) => !!errores[campo]);

    const getTabClass = (id, campos) => {
        const esActiva = tabActiva === id;
        const conError = tieneErrores(campos);
        let base = 'flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all duration-200 ';

        if (conError) {
            return base + (esActiva ? 'text-red-600 border-red-600 bg-red-50' : 'text-red-400 border-transparent hover:text-red-500');
        }
        return base + (esActiva ? 'text-[#7a0202] border-[#7a0202] bg-red-50/30' : 'text-gray-400 border-transparent hover:text-gray-900 hover:bg-gray-50');
    };

    return {
        abierto,
        abrir,
        cerrar,
        tabActiva,
        setTabActiva,
        formulario,
        cambiar,
        errores,
        estaCargando,
        setData,
        enviar,
        limpiar,
        MAX_FOTOS,
        fotosNuevas,
        fotosGuardadas,
        previsualizaciones,
        agregarFotos,
        quitarFoto,
        getTabClass,
        TIPOS_HABITACION,
    };
}
