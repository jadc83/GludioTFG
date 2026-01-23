import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { useFormGenerico } from './useFormGenerico';

export function useClienteForm(cliente = null, alGuardar) {
    /**
     * Determina si el cliente es un usuario basándose en la columna de email_verified_at
     */
    const esUsuario = () => {
        return cliente && Object.prototype.hasOwnProperty.call(cliente, 'email_verified_at');
    };

    /**
     * Obtiene la ruta y tipo para cliente o usuario
     */
    const obtenerRutas = () => {
        const esUser = esUsuario();
        const rutaCrear = esUser ? '/users' : '/clientes';
        const rutaActualizar = cliente ? (esUser ? `/users/${cliente.id}` : `/clientes/${cliente.id}`) : '';
        return { rutaCrear, rutaActualizar };
    };

    const { rutaCrear, rutaActualizar } = obtenerRutas();

    const form = useFormGenerico(
        { name: '', email: '', telefono: '', tipo_documento: 'dni', numero_documento: '', nacionalidad: '',  direccion: '', ciudad: '', codigo_postal: ''}, rutaCrear,  rutaActualizar,
        () => {
            alGuardar?.();
            router.reload({ only: ['clientes'] });
        }
    );

    /**
     * Pre-rellena el formulario cuando cambia el cliente seleccionado
     */
    useEffect(() => {
        if (cliente) { form.cargarDatos({ name: cliente.name || '',
                                          email: cliente.email || '',
                                          telefono: cliente.telefono || '',
                                          tipo_documento: cliente.tipo_documento || 'dni',
                                          numero_documento: cliente.numero_documento || '',
                                          nacionalidad: cliente.nacionalidad || '',
                                          direccion: cliente.direccion || '',
                                          ciudad: cliente.ciudad || '',
                                          codigo_postal: cliente.codigo_postal || ''});
        } else {
            form.limpiar();
        }
    }, [cliente?.id]);

    return { formulario: form.formulario, errores: form.errores, estaCargando: form.estaCargando, cambiar: form.cambiar, enviar: form.guardar, limpiar: form.limpiar };
}
