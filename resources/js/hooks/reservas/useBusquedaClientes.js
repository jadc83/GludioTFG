import { useEffect, useRef, useState } from 'react';
import { obtenerClientes } from '@/hooks/reservas/service';

export default function useBusquedaClientes({ onSeleccionar, clienteSeleccionado }) {
    const [busqueda, setBusqueda] = useState('');
    const [clientes, setClientes] = useState([]);
    const [filtrados, setFiltrados] = useState([]);
    const [mostrarResultados, setMostrarResultados] = useState(false);
    const [cargando, setCargando] = useState(false);
    const contenedorRef = useRef(null);

    useEffect(() => {
        setCargando(true);
        obtenerClientes()
            .then((data) => setClientes(data || []))
            .finally(() => setCargando(false));
    }, []);

    useEffect(() => {
        if (!busqueda.trim()) {
            setFiltrados([]);
            return;
        }

        const termino = busqueda.toLowerCase();
        const resultados = clientes.filter((cliente) => {
            const nombre = (cliente.name || '').toLowerCase();
            const email = (cliente.email || '').toLowerCase();
            const documento = (cliente.numero_documento || '').toLowerCase();

            return (
                nombre.includes(termino) ||
                email.includes(termino) ||
                documento.includes(termino)
            );
        });

        setFiltrados(resultados);
    }, [busqueda, clientes]);

    useEffect(() => {
        const handleClickFuera = (event) => {
            if (contenedorRef.current && !contenedorRef.current.contains(event.target)) {
                setMostrarResultados(false);
            }
        };

        document.addEventListener('mousedown', handleClickFuera);
        return () => document.removeEventListener('mousedown', handleClickFuera);
    }, []);

    const seleccionarCliente = (cliente) => {
        if (onSeleccionar) onSeleccionar(cliente);
        setBusqueda(`${cliente.name} - ${cliente.email}`);
        setMostrarResultados(false);
    };

    const limpiar = () => {
        setBusqueda('');
        setFiltrados([]);
        if (onSeleccionar) onSeleccionar(null);
    };

    return {
        busqueda,
        setBusqueda,
        clientes,
        filtrados,
        mostrarResultados,
        setMostrarResultados,
        cargando,
        contenedorRef,
        seleccionarCliente,
        limpiar,
        clienteSeleccionado,
    };
}
