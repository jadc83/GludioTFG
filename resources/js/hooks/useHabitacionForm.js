import { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';

const CAPACIDADES = { doble: 2, suite: 2, familiar: 4 };
const MAX_FOTOS = 4;

export function useHabitacionForm(habitacionInicial = null, onSuccess = null) {
    const esEdicion = !!habitacionInicial?.id;

    const { data, setData, post, processing, errors, reset: resetForm, clearErrors } = useForm({
        numero: '',
        tipo: 'doble',
        precio_noche: '',
        capacidad: CAPACIDADES['doble'],
        estado: 'disponible',
        descripcion: '',
        notas: ''
    });

    const [fotos, setFotos] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [fotosGuardadas, setFotosGuardadas] = useState([]);
    const [fotosEliminadas, setFotosEliminadas] = useState([]);

    useEffect(() => {
        if (esEdicion && habitacionInicial) {
            setData({
                numero: habitacionInicial.numero || '',
                tipo: habitacionInicial.tipo || 'doble',
                precio_noche: habitacionInicial.precio_noche || '',
                capacidad: habitacionInicial.capacidad || CAPACIDADES[habitacionInicial.tipo],
                estado: habitacionInicial.estado || 'disponible',
                descripcion: habitacionInicial.descripcion || '',
                notas: habitacionInicial.notas || ''
            });

            const fotosExistentes = (habitacionInicial.fotos || []).map(f => ({
                id: f.id,
                url: f.url,
                ruta: f.ruta
            }));
            setFotosGuardadas(fotosExistentes);
            setPreviews(fotosExistentes.map(f => f.url));
            setFotos([]);
            setFotosEliminadas([]);
        }
        clearErrors();
    }, [esEdicion, habitacionInicial]);

    const cambiar = (e) => {
        const { name, value } = e.target;
        setData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === 'tipo' && { capacidad: CAPACIDADES[value] || '' }),
        }));
    };

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
            if (fotoAEliminar?.id) {
                setFotosEliminadas((prev) => [...prev, fotoAEliminar.id]);
            }
            setFotosGuardadas((prev) => prev.filter((_, i) => i !== index));
        } else {
            const newIndex = index - fotosGuardadas.length;
            setFotos((prev) => prev.filter((_, i) => i !== newIndex));
        }
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const enviar = (e) => {
        e.preventDefault();

        const url = esEdicion ? `/habitaciones/${habitacionInicial.id}` : '/habitaciones';

        post(url, {
            forceFormData: true,
            preserveState: false,
            preserveScroll: false,
            onSuccess: () => {
                reset();
                onSuccess?.();
            },
            transform: (data) => {
                const formData = new FormData();
                Object.entries(data).forEach(([key, value]) => formData.append(key, value));
                fotos.forEach((foto, index) => formData.append(`fotos[${index}]`, foto));

                if (esEdicion) {
                    fotosEliminadas.forEach((id) => formData.append('fotos_eliminar[]', id));
                    formData.append('_method', 'PUT');
                }

                return formData;
            },
        });
    };

    const reset = () => {
        resetForm();
        setFotos([]);
        setPreviews([]);
        setFotosGuardadas([]);
        setFotosEliminadas([]);
    };

    const capacidadFija = CAPACIDADES.hasOwnProperty(data.tipo);

    return { form: data, fotos, previews, fotosGuardadas, errores: errors, guardando: processing, capacidadFija, MAX_FOTOS, esEdicion, cambiar, agregarFotos, quitarFoto, enviar, reset };
}
