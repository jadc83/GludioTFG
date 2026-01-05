import { router, useForm } from '@inertiajs/react';
import { useEffect } from 'react';

export function useClienteForm(cliente = null, alGuardar) {
    const {
        data: formulario,
        setData,
        post,
        put,
        processing: estaCargando,
        errors: errores,
        reset: reset,
    } = useForm({
        name: '',
        email: '',
        telefono: '',
        tipo_documento: 'dni',
        numero_documento: '',
        nacionalidad: '',
        direccion: '',
    });

    /**
     * Pre-rellena el formulario cuando cambia el cliente seleccionado
     */
    useEffect(() => {
        if (cliente) {
            setData({
                name: cliente.name || '',
                email: cliente.email || '',
                telefono: cliente.telefono || '',
                tipo_documento: cliente.tipo_documento || 'dni',
                numero_documento: cliente.numero_documento || '',
                nacionalidad: cliente.nacionalidad || '',
                direccion: cliente.direccion || '',
            });
        } else {
            reset();
        }
    }, [cliente, setData, reset]);

    /**
     * Actualiza un campo del formulario
     * @param {Event} evento - Evento del input
     */
    const cambiar = (evento) => {
        const { name, value } = evento.target;
        setData(name, value);
    };

    /**
     * Determina si el cliente es un usuario basándose en la presencia de email_verified_at
     * @returns {boolean} True si es usuario, false si es cliente
     */
    const esUsuario = () => {
        return cliente && Object.prototype.hasOwnProperty.call(cliente, 'email_verified_at');
    };

    /**
     * Construye la URL y método HTTP para la solicitud
     * @returns {Object} {url, metodoHttp}
     */
    const obtenerInfoPunto = () => {
        if (esUsuario()) {
            return {
                url: cliente ? `/users/${cliente.id}` : '/users',
                metodoHttp: cliente ? 'put' : 'post',
            };
        } else {
            return {
                url: cliente ? `/clientes/${cliente.id}` : '/clientes',
                metodoHttp: cliente ? 'put' : 'post',
            };
        }
    };

    /**
     * Envía el formulario al servidor (crear o actualizar)
     * @param {Event} evento - Evento del formulario
     */
    const enviar = (evento) => {
        evento.preventDefault();

        const { url, metodoHttp } = obtenerInfoPunto();

        const configEnvio = {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                alGuardar?.();
                router.reload({ only: ['clientes'] });
            },
        };

        if (metodoHttp === 'post') {
            post(url, configEnvio);
        } else {
            put(url, configEnvio);
        }
    };

    /**
     * Resetea el formulario a su estado inicial
     */
    const limpiar = () => {
        reset();
    };

    return {
        // Estado del formulario
        formulario,
        errores,
        estaCargando,

        // Métodos del formulario
        cambiar,
        enviar,
        limpiar,
    };
}
