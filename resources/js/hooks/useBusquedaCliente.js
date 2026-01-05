import { useEffect, useState } from 'react';
export default function useBusquedaCliente({ formulario, setReservableId: setIdReservable, setReservableTipo: setTipoReservable }) {
    const [consulta, setConsulta] = useState('');
    const [resultados, setResultados] = useState([]);
    const [estaBuscando, setEstaBuscando] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

    // Debounced search effect
    useEffect(() => {
        // Requisitos mínimos para buscar
        if (!consulta || consulta.length < 3) {
            setResultados([]);
            return;
        }

        let estaActiva = true;
        setEstaBuscando(true);

        // Debounce timer
        const timerRetraso = setTimeout(async () => {
            try {
                const respuesta = await fetch(
                    `/clientes/buscar?query=${encodeURIComponent(consulta)}`,
                    { headers: { Accept: 'application/json' } }
                );

                if (!estaActiva) return;

                if (respuesta.ok) {
                    const datos = await respuesta.json();
                    setResultados(Array.isArray(datos) ? datos : []);
                } else {
                    setResultados([]);
                }
            } catch (error) {
                console.error('Error buscando clientes:', error);
                setResultados([]);
            } finally {
                if (estaActiva) setEstaBuscando(false);
            }
        }, 300); // 300ms debounce

        return () => {
            estaActiva = false;
            clearTimeout(timerRetraso);
        };
    }, [consulta]);

    /**
     * Actualiza un campo del formulario de forma segura
     */
    const cambiar = (nombreCampo, valorCampo) => {
        try {
            formulario.setData(nombreCampo, valorCampo);
        } catch (error) {
            console.error(`Error actualizando campo ${nombreCampo}:`, error);
        }
    };

    /**
     * Limpia todos los datos personales del formulario
     */
    const limpiarFormulario = () => {
        const camposALimpiar = ['name', 'email', 'telefono', 'numero_documento', 'nacionalidad', 'direccion'];
        camposALimpiar.forEach(campo => cambiar(campo, ''));
        cambiar('tipo_documento', 'dni');
    };

    /**
     * Selecciona un cliente y rellena el formulario con sus datos
     */
    const seleccionarCliente = (datosCliente) => {
        setClienteSeleccionado(datosCliente);

        // Si no hay cliente seleccionado, limpiar todo
        if (!datosCliente) {
            limpiarFormulario();
            setIdReservable(null);
            setTipoReservable(null);
            return;
        }

        // Rellenar formulario con datos del cliente
        cambiar('name', datosCliente.nombre || datosCliente.name || '');
        cambiar('email', datosCliente.email || '');
        cambiar('telefono', datosCliente.telefono || '');
        cambiar('tipo_documento', datosCliente.tipo_documento || 'dni');
        cambiar('numero_documento', datosCliente.numero_documento || '');
        cambiar('nacionalidad', datosCliente.nacionalidad || '');
        cambiar('direccion', datosCliente.direccion || '');

        // Registrar al cliente como reservable
        setIdReservable(datosCliente.id);
        setTipoReservable(datosCliente.tipo_usuario || null);

        // Limpiar búsqueda
        setConsulta('');
    };

    return {
        consulta,
        setConsulta,
        resultados,
        estaBuscando,
        clienteSeleccionado,
        seleccionarCliente,
    };
}
