import { useState } from 'react';
import { router } from '@inertiajs/react';

const CAPACIDADES = { doble: 2, suite: 2, familiar: 4 };
const MAX_FOTOS = 4;

const estadoInicial = (tipo = 'doble') => ({
  numero: '',
  tipo,
  precio_noche: '',
  capacidad: CAPACIDADES[tipo],
  estado: 'disponible',
  descripcion: '',
  notas: ''
});

export default function useCreateHabitacion(onSuccessExtra) {
  const [form, setForm] = useState(estadoInicial());
  const [fotos, setFotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  const cambiar = ({ target: { name, value } }) =>
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'tipo' && { capacidad: CAPACIDADES[value] }),
    }));

  const agregarFotos = e => {
    const nuevos = Array.from(e.target.files).slice(0, MAX_FOTOS - fotos.length);
    if (!nuevos.length) return;

    setFotos(prev => [...prev, ...nuevos]);
    nuevos.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setPreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const quitarFoto = i => {
    setFotos(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const reset = () => {
    setForm(estadoInicial());
    setFotos([]);
    setPreviews([]);
    setErrores({});
    setGuardando(false);
  };

  const enviar = e => {
    e.preventDefault();
    setGuardando(true);
    setErrores({});

    const datos = new FormData();
    Object.entries(form).forEach(([k, v]) => datos.append(k, v));
    fotos.forEach((foto, i) => datos.append(`fotos[${i}]`, foto));

    router.post('/habitaciones', datos, {
      forceFormData: true,
      onSuccess: () => {
        reset();
        onSuccessExtra && onSuccessExtra();
      },
      onError: err => {
        setErrores(err || {});
        setGuardando(false);
      },
    });
  };

  const capacidadFija = !!CAPACIDADES[form.tipo];

  return {
    form,
    cambiar,
    errores,
    guardando,
    capacidadFija,
    fotos,
    previews,
    agregarFotos,
    quitarFoto,
    enviar,
    MAX_FOTOS,
  };
}
