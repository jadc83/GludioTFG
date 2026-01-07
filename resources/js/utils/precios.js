

/**
 * Obtiene el precio base fijo por tipo de habitación
 */
export function obtenerPrecioBasePorTipo(tipo) {
    const precios = {
        'doble': 75,
        'familiar': 125,
        'suite': 200
    };
    return precios[tipo?.toLowerCase()] || 0;
}

/**
 * Calcula el precio dinámico basado en modificadores de temporada
 */
export function calcularPrecioDinamico(habitacionOPrecio, checkIn, checkOut) {
    // Soportar tanto objetos habitación como valores numéricos
    let precioBase;

    if (typeof habitacionOPrecio === 'object') {
        // Si es un objeto, intentar obtener precio_noche
        precioBase = habitacionOPrecio.precio_noche || 0;
        // Si no tiene precio_noche, intentar por tipo
        if (!precioBase && habitacionOPrecio.tipo) {
            precioBase = obtenerPrecioBasePorTipo(habitacionOPrecio.tipo);
        }
    } else if (typeof habitacionOPrecio === 'string') {
        // Si es un string (tipo de habitación), obtener precio por tipo
        precioBase = obtenerPrecioBasePorTipo(habitacionOPrecio);
    } else {
        // Si es número, usarlo directamente
        precioBase = habitacionOPrecio;
    }

    if (!checkIn || !checkOut) return precioBase;

    let total = 0;
    let fecha = new Date(checkIn);
    const fechaFin = new Date(checkOut);

    while (fecha < fechaFin) {
        let modificador = 1.0;

        const mes = fecha.getMonth() + 1;
        const dia = fecha.getDate();
        if (mes === 7 || mes === 8 || (mes === 12 && dia >= 20)) {
            modificador *= 1.5;
        } else if ((mes === 3 || mes === 4) && dia >= 15 && dia <= 31) {
            modificador *= 1.2;
        }

        if (fecha.getDay() === 0 || fecha.getDay() === 6) {
            modificador *= 1.25;
        }

        const fechaFormato = `${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const festivos = [
            '01-01',
            '01-06',
            '05-01',
            '08-15',
            '10-12',
            '11-01',
            '12-25',
        ];
        if (festivos.includes(fechaFormato)) {
            modificador *= 1.5;
        }

        total += precioBase * modificador;
        fecha.setDate(fecha.getDate() + 1);
    }

    return Math.round(total);
}

/**
 * Obtiene el precio base de un tipo de habitación

 */
export function obtenerPrecioBase(habitacionesDisponibles, tipo) {
    // Usar precios fijos por tipo, NO los de la BD
    return obtenerPrecioBasePorTipo(tipo);
}

