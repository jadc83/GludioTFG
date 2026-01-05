import { z } from 'zod';

export const reservaSchema = z.object({
    // Paso 1: Fechas
    check_in: z.date({ invalid_type_error: 'Fecha de entrada requerida' }),
    check_out: z.date({ invalid_type_error: 'Fecha de salida requerida' }),

    // Paso 2: Datos del cliente
    name: z.string().min(2, 'Nombre requerido'),
    email: z.string().email('Email válido requerido'),
    telefono: z.string().min(7, 'Teléfono válido requerido'),
    tipo_documento: z.enum(['dni', 'nie', 'pasaporte']),
    numero_documento: z.string().min(5, 'Número de documento requerido'),
    nacionalidad: z.string().optional(),
    direccion: z.string().optional(),

    // Paso 3: Habitaciones
    habitaciones: z
        .array(
            z.object({
                tipo: z.string(),
                cantidad: z.number().min(1),
                personas_por_habitacion: z.number().min(1),
            }),
        )
        .min(1, 'Selecciona al menos una habitación'),
});
