

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
 * SIEMPRE usa el precio base según el tipo, nunca precio_noche de la habitación
 */
export function calcularPrecioDinamico(habitacionOPrecio, checkIn, checkOut) {
    let precioBase;
    let tipo = null;

    // Obtener el tipo de habitación
    if (typeof habitacionOPrecio === 'object' && habitacionOPrecio.tipo) {
        tipo = habitacionOPrecio.tipo;
    }

    // SIEMPRE usar precio base según tipo, nunca precio_noche de la base de datos
    precioBase = obtenerPrecioBasePorTipo(tipo);

    if (!precioBase || !checkIn || !checkOut) {
        return precioBase || 0;
    }

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
    return obtenerPrecioBasePorTipo(tipo);
}

