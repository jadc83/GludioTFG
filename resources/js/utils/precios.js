export function calcularPrecioDinamico(habitacion, checkIn, checkOut) {
    if (!checkIn || !checkOut) return habitacion.precio_noche || 0;

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

        total += (habitacion.precio_noche || 0) * modificador;
        fecha.setDate(fecha.getDate() + 1);
    }

    return Math.round(total);
}
