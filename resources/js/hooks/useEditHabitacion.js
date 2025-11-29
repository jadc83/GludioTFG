import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

const CAPACIDADES = { doble: 2, suite: 2, familiar: 4 };
const MAX_FOTOS = 4;

export const useEditHabitacion = (habitacion, abierto, onCerrar) => {
    const [form, setForm] = useState({
        numero: '',
        tipo: 'doble',
        precio_noche: '',
        capacidad: '',
        estado: 'disponible',
        descripcion: '',
        notas: ''
    });
    const [fotos, setFotos] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [fotosGuardadas, setExistingFotos] = useState([]);
    const [deletedFotos, setDeletedFotos] = useState([]);
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (abierto && habitacion) {
            setForm({
                numero: habitacion.numero || '',
                tipo: habitacion.tipo || 'doble',
                precio_noche: habitacion.precio_noche || '',
                capacidad: habitacion.capacidad || '',
                estado: habitacion.estado || 'disponible',
                descripcion: habitacion.descripcion || '',
                notas: habitacion.notas || ''
            });

            const fotosExistentes = (habitacion.fotos || []).map(f => ({
                id: f.id,
                url: f.url,
                ruta: f.ruta
            }));
            setExistingFotos(fotosExistentes);
            setPreviews(fotosExistentes.map(f => f.url));
            setFotos([]);
            setDeletedFotos([]);
            setErrores({});
        }
    }, [abierto, habitacion]);

    const cambiar = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
            ...(name === 'tipo' && { capacidad: CAPACIDADES[value] || '' }),
        }));
    };

    const capacidadFija = CAPACIDADES.hasOwnProperty(form.tipo);

    const agregarFotos = (e) => {
        const totalActual = fotosGuardadas.length + fotos.length;
        const archivos = Array.from(e.target.files).slice(0, MAX_FOTOS - totalActual);
        if (!archivos.length) return;

        setFotos((prev) => [...prev, ...archivos]);

        archivos.forEach((archivo) => {
            const reader = new FileReader();
            reader.onload = (ev) => setPreviews((prev) => [...prev, ev.target.result]);
            reader.readAsDataURL(archivo);
        });
        e.target.value = '';
    };

    const quitarFoto = (index) => {
        if (index < fotosGuardadas.length) {
            const fotoAEliminar = fotosGuardadas[index];
            if (fotoAEliminar && fotoAEliminar.id) {
                setDeletedFotos((prev) => [...prev, fotoAEliminar.id]);
            }
            setExistingFotos((prev) => prev.filter((_, i) => i !== index));
            setPreviews((prev) => prev.filter((_, i) => i !== index));
        } else {
            const newIndex = index - fotosGuardadas.length;
            setFotos((prev) => prev.filter((_, i) => i !== newIndex));
            setPreviews((prev) => prev.filter((_, i) => i !== index));
        }
    };

    const enviar = (e) => {
        e.preventDefault();
        setGuardando(true);
        setErrores({});

        const datos = new FormData();
        Object.entries(form).forEach(([key, value]) => datos.append(key, value));
        fotos.forEach((foto, index) => datos.append(`fotos[${index}]`, foto));

        deletedFotos.forEach((id) => datos.append('fotos_eliminar[]', id));

        datos.append('_method', 'PUT');

        router.post(`/habitaciones/${habitacion.id}`, datos, {
            forceFormData: true,
            onSuccess: () => {
                setFotos([]);
                setPreviews([]);
                setExistingFotos([]);
                setDeletedFotos([]);
                setGuardando(false);
                onCerrar();
                router.reload();
            },
            onError: (error) => {
                setErrores(error || {});
                setGuardando(false);
            },
        });
    };

    return {
        data: { form, fotos, previews, capacidadFija, MAX_FOTOS, fotosGuardadas },
        ui: { errores, guardando },
        actions: { cambiar, agregarFotos, quitarFoto, enviar }
    };
};

export default useEditHabitacion;
