// resources/js/hooks/useHabitacionForm.js
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

const CAPACIDADES = { doble: 2, suite: 2, familiar: 4 };
const MAX_FOTOS = 4;

export function useHabitacionForm(habitacionInicial = null, onSuccess = null) {
    const esEdicion = !!habitacionInicial?.id;

    const [form, setForm] = useState({
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
    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (esEdicion && habitacionInicial) {
            setForm({
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
        setErrores({});
    }, [esEdicion, habitacionInicial]);

    const cambiar = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
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
        setGuardando(true);
        setErrores({});

        const datos = new FormData();
        Object.entries(form).forEach(([key, value]) => datos.append(key, value));
        fotos.forEach((foto, index) => datos.append(`fotos[${index}]`, foto));

        if (esEdicion) {
            fotosEliminadas.forEach((id) => datos.append('fotos_eliminar[]', id));
            datos.append('_method', 'PUT');

            router.post(`/habitaciones/${habitacionInicial.id}`, datos, {
                forceFormData: true,
                onSuccess: () => {
                    reset();
                    setGuardando(false);
                    onSuccess?.();
                    router.reload();
                },
                onError: (error) => {
                    setErrores(error || {});
                    setGuardando(false);
                },
            });
        } else {
            router.post('/habitaciones', datos, {
                forceFormData: true,
                onSuccess: () => {
                    reset();
                    setGuardando(false);
                    onSuccess?.();
                },
                onError: (error) => {
                    setErrores(error || {});
                    setGuardando(false);
                },
            });
        }
    };

    const reset = () => {
        setForm({
            numero: '',
            tipo: 'doble',
            precio_noche: '',
            capacidad: CAPACIDADES['doble'],
            estado: 'disponible',
            descripcion: '',
            notas: ''
        });
        setFotos([]);
        setPreviews([]);
        setFotosGuardadas([]);
        setFotosEliminadas([]);
        setErrores({});
    };

    const capacidadFija = CAPACIDADES.hasOwnProperty(form.tipo);

    return { form, fotos, previews, fotosGuardadas, errores, guardando, capacidadFija, MAX_FOTOS, esEdicion, cambiar, agregarFotos, quitarFoto, enviar, reset};
}
