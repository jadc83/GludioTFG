import { router, useForm } from '@inertiajs/react';
import { useEffect } from 'react';

export function useClienteForm(cliente = null, onSuccess) {
    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
        reset: resetForm,
    } = useForm({
        name: '',
        email: '',
        telefono: '',
        tipo_documento: 'dni',
        numero_documento: '',
        nacionalidad: '',
        direccion: '',
    });

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
            resetForm();
        }
    }, [cliente, setData, resetForm]);

    const cambiar = (e) => {
        const { name, value } = e.target;
        setData(name, value);
    };

    const enviar = (e) => {
        e.preventDefault();

        const esUser =
            cliente &&
            Object.prototype.hasOwnProperty.call(cliente, 'email_verified_at');

        let url, method;

        if (esUser) {
            url = cliente ? `/users/${cliente.id}` : '/users';
            method = cliente ? 'put' : 'post';
        } else {
            url = cliente ? `/clientes/${cliente.id}` : '/clientes';
            method = cliente ? 'put' : 'post';
        }

        // useForm provides post/put methods
        if (method === 'post') {
            post(url, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    onSuccess?.();
                    router.reload({ only: ['clientes'] });
                },
            });
        } else {
            put(url, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    onSuccess?.();
                    router.reload({ only: ['clientes'] });
                },
            });
        }
    };

    const reset = () => {
        resetForm();
    };

    return {
        form: data,
        cambiar,
        errores: errors,
        guardando: processing,
        enviar,
        reset,
    };
}
