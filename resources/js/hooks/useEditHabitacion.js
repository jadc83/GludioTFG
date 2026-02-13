import { useEffect, useMemo, useState } from 'react';
import { useFormGenerico } from '@/hooks/useFormGenerico';
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

export default function useEditHabitacion({ habitacion, onSuccess } = {}) {
    const {
        formulario,
        cambiar,
        errores,
        estaCargando,
        setData,
        guardar,
        cargarDatos,
        limpiar,
    } = useFormGenerico(DATOS_INICIALES, '', habitacion ? `/habitaciones/${habitacion.id}` : '', () => {
        limpiar();
    });

    const MAX_FOTOS = 4;
    const [fotosNuevas, setFotosNuevas] = useState([]);
    const [fotosGuardadas, setFotosGuardadas] = useState([]);
    const [fotosAEliminar, setFotosAEliminar] = useState([]);

    useEffect(() => {
        if (habitacion) {
            cargarDatos({
                numero: habitacion.numero || '',
                tipo: habitacion.tipo || 'doble',
                capacidad: habitacion.capacidad || 2,
                estado: habitacion.estado || 'disponible',
                descripcion: habitacion.descripcion || '',
                notas: habitacion.notas || '',
            });
            setFotosGuardadas(
                habitacion.fotos?.map((f) => ({ id: f.id, url: f.url || `/storage/${f.ruta}` })) || [],
            );
        }
    }, [habitacion, cargarDatos]);

    const previsualizaciones = useMemo(() => [
        ...fotosGuardadas.map((f) => f.url),
        ...fotosNuevas.map((f) => URL.createObjectURL(f)),
    ], [fotosGuardadas, fotosNuevas]);

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
        if (!habitacion) return;

        try {
            const fd = new FormData();
            fd.append('_method', 'PUT');
            fd.append('numero', formulario.numero || '');
            fd.append('tipo', formulario.tipo || 'doble');
            fd.append('capacidad', formulario.capacidad || 1);
            fd.append('estado', formulario.estado || 'disponible');
            fd.append('descripcion', formulario.descripcion || '');
            fd.append('notas', formulario.notas || '');
            fotosNuevas.forEach((f) => fd.append('fotos[]', f));
            fotosAEliminar.forEach((id) => fd.append('fotos_eliminar[]', id));

            const res = await habitacionesService.updateHabitacionFormData(habitacion.id, fd);
            // éxito
            limpiar();
            setFotosNuevas([]);
            setFotosAEliminar([]);
            if (onSuccess) onSuccess(res);
            window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Habitación actualizada', type: 'success' } }));
            try { Inertia.reload(); } catch (err) { /* no bloquear */ }
            window.dispatchEvent(new Event('habitaciones:updated'));
        } catch (err) {
            const resp = err || {};
            // dejar que el caller maneje `errores` si es necesario
            window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: resp.error || 'Error al actualizar habitación', type: 'error' } }));
        }
    };

    return {
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
        fotosAEliminar,
        previsualizaciones,
        agregarFotos,
        quitarFoto,
    };
}
