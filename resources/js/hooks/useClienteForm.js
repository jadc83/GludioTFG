import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

export function useClienteForm(cliente = null, onSuccess) {
    const [form, setForm] = useState({
        name: '',
        email: '',
        telefono: '',
        tipo_documento: 'dni',
        numero_documento: '',
        nacionalidad: '',
        direccion: '',
    });

    const [errores, setErrores] = useState({});
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (cliente) {
            setForm({
                name: cliente.name || '',
                email: cliente.email || '',
                telefono: cliente.telefono || '',
                tipo_documento: cliente.tipo_documento || 'dni',
                numero_documento: cliente.numero_documento || '',
                nacionalidad: cliente.nacionalidad || '',
                direccion: cliente.direccion || '',
            });
            setErrores({});
        } else {
            setForm({
                name: '',
                email: '',
                telefono: '',
                tipo_documento: 'dni',
                numero_documento: '',
                nacionalidad: '',
                direccion: '',
            });
        }
    }, [cliente]);

    const cambiar = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
        if (errores[name]) {
            setErrores({ ...errores, [name]: '' });
        }
    };

    const enviar = (e) => {
        e.preventDefault();
        setGuardando(true);

        const esUser = cliente && cliente.hasOwnProperty('email_verified_at');

        let url, method;

        if (esUser) {
            url = cliente ? `/users/${cliente.id}` : '/users';
            method = cliente ? 'put' : 'post';
        } else {
            url = cliente ? `/clientes/${cliente.id}` : '/clientes';
            method = cliente ? 'put' : 'post';
        }

        router[method](url, form, {
            onSuccess: () => {
                setGuardando(false);
                onSuccess();
            },
            onError: (errors) => {
                setErrores(errors);
                setGuardando(false);
            },
        });
    };

    const reset = () => {
        setForm({
            name: '',
            email: '',
            telefono: '',
            tipo_documento: 'dni',
            numero_documento: '',
            nacionalidad: '',
            direccion: '',
        });
        setErrores({});
    };

    return { form, cambiar, errores, guardando, enviar, reset };
}
