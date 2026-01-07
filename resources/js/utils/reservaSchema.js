import { z } from 'zod';


export const reservaSchema = z.object({
    // Paso 1: Fechas
    check_in: z.date(),
    check_out: z.date(),

    // Paso 2: Datos del cliente
    name: z.string().min(1),
    email: z.string().optional().or(z.literal('')),
    telefono: z.string().optional().or(z.literal('')),
    tipo_documento: z.enum(['dni', 'nie', 'pasaporte']),
    numero_documento: z.string().optional().or(z.literal('')),
    nacionalidad: z.string().optional().or(z.literal('')),
    direccion: z.string().optional().or(z.literal('')),

    // Paso 3: Habitaciones
    habitaciones: z.array(
        z.object({
            tipo: z.string(),
            cantidad: z.number(),
            personas_por_habitacion: z.number(),
        })
    ),
});
