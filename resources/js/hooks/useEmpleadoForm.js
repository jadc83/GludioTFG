import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { useFormGenerico } from './useFormGenerico';

export function useEmpleadoForm(empleado = null, alGuardar, options = { reloadOnSave: true }) {
    const obtenerRutas = () => {
        const rutaCrear = '/empleados';
        const rutaActualizar = empleado ? `/empleados/${empleado.id}` : '';
        return { rutaCrear, rutaActualizar };
    };

    const { rutaCrear, rutaActualizar } = obtenerRutas();

    const form = useFormGenerico(
        { name: '', email: '', password: '', password_confirmation: '', numero_empleado: '', departamento: '', puesto: '', tipo_documento: 'dni', numero_documento: '', nacionalidad: '', direccion: '', ciudad: '', codigo_postal: '', telefono: ''}, rutaCrear, rutaActualizar,
        () => {
            alGuardar?.();
            if (options.reloadOnSave) {
                router.reload({ only: ['empleados'] });
            }
        }
    );

    useEffect(() => {
        if (empleado) {
            form.cargarDatos({
                name: empleado.name || '',
                email: empleado.email || '',
                numero_empleado: empleado.numero_empleado || '',
                departamento: empleado.departamento || '',
                puesto: empleado.puesto || '',
                tipo_documento: empleado.tipo_documento || 'dni',
                numero_documento: empleado.numero_documento || '',
                nacionalidad: empleado.nacionalidad || '',
                direccion: empleado.direccion || '',
                ciudad: empleado.ciudad || '',
                codigo_postal: empleado.codigo_postal || '',
                telefono: empleado.telefono || '',
            });
        } else {
            form.limpiar();
        }
    }, [empleado?.id]);

    return { formulario: form.formulario, errores: form.errores, estaCargando: form.estaCargando, cambiar: form.cambiar, enviar: form.guardar, limpiar: form.limpiar };
}
