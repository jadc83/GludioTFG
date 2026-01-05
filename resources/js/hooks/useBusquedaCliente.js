import { useEffect, useState } from 'react';

export default function useBusquedaCliente({ modoNuevo, reservaNoEsParaMi, formulario, setReservableId, setReservableTipo }) {
    const [query, setQuery] = useState('');
    const [resultados, setResultados] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [seleccionado, setSeleccionado] = useState(null);

    useEffect(() => {
        if (!query || query.length < 3) { setResultados([]); return; }
        if (modoNuevo && !reservaNoEsParaMi) { setResultados([]); return; }

        let activo = true;
        setCargando(true);
        const id = setTimeout(async () => {
            try {
                const res = await fetch(`/clientes/buscar?query=${encodeURIComponent(query)}`, {
                    headers: { Accept: 'application/json' }
                });
                if (!activo) return;
                if (res.ok) {
                    const json = await res.json();
                    setResultados(Array.isArray(json) ? json : []);
                } else setResultados([]);
            } catch (err) {
                setResultados([]);
            } finally {
                if (activo) setCargando(false);
            }
        }, 300);

        return () => { activo = false; clearTimeout(id); };
    }, [query, modoNuevo, reservaNoEsParaMi]);

    const setData = (key, value) => {
        try { formulario.setData(key, value); } catch (e) { void e; }
    };

    const limpiarDatos = () => {
        ['name', 'email', 'telefono', 'numero_documento', 'nacionalidad', 'direccion'].forEach(k => setData(k, ''));
        setData('tipo_documento', 'dni');
    };

    const seleccionarCliente = (p) => {
        setSeleccionado(p);

        if (!p) {
            limpiarDatos();
            setReservableId(null);
            setReservableTipo(null);
            return;
        }

        if (reservaNoEsParaMi) {
            setData('name', p.nombre || p.name || '');
            setData('email', p.email || '');
            setData('telefono', p.telefono || '');
            setData('tipo_documento', p.tipo_documento || 'dni');
            setData('numero_documento', p.numero_documento || '');
            setData('nacionalidad', p.nacionalidad || '');
            setData('direccion', p.direccion || '');
            setReservableId(p.id);
            setReservableTipo(p.tipo_usuario || null);
            setQuery('');
        } else {
            limpiarDatos();
        }
    };

    return { query, setQuery, resultados, cargando, seleccionado, seleccionarCliente };
}
