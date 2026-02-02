export const PATRONES_VALIDACION = {
    email: {
        patron: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        titulo: 'Introduce un email válido',
    },
    telefono: {
        patron: '^\\+?[0-9\\s\\-()]{7,15}$',
        titulo: 'Teléfono: solo números, espacios, guiones o paréntesis',
    },
    codigoPostal: {
        patron: '^\\d{4,6}$',
        titulo: 'Código postal: 4 a 6 dígitos',
    },
    dniNie: {
        patron: '([XxYyZz]\\d{7}[A-Za-z]|\\d{8}[A-Za-z])',
        titulo: 'DNI/NIE: formato 8 dígitos + letra o NIE (X/Y/Z + 7 dígitos + letra)',
    },
    pasaporte: {
        patron: '^[A-Za-z0-9\\-\\s]{5,20}$',
        titulo: 'Pasaporte: letras y números (5-20 caracteres)',
    },
    nombre: {
        patron: "^[A-Za-zÀ-ÖØ-öø-ÿ'´`\\- ]{2,60}$",
        titulo: 'Nombre: solo letras, espacios y guiones',
    },
    ciudad: {
        patron: "^[A-Za-zÀ-ÖØ-öø-ÿ'´`\\- ]{2,60}$",
        titulo: 'Ciudad: solo letras y espacios',
    },
    pais: {
        patron: "^[A-Za-zÀ-ÖØ-öø-ÿ'´`\\- ]{2,60}$",
        titulo: 'Introduce un país válido',
    },
    numero: {
        patron: '^\\d+$',
        titulo: 'Solo números',
    },
    localizador: {
        patron: '^[A-Z0-9-]{4,20}$',
        titulo: 'Localizador: letras mayúsculas, números o guión',
    },
    precio: {
        patron: '^\\d{1,9}(?:[\\.,]\\d{1,2})?$',
        titulo: 'Número: opcional decimales (ej. 123.45)',
    },
    capacidad: {
        patron: '^\\d+$',
        titulo: 'Introduce un número entero',
    },
    fecha: {
        patron: '^\\d{4}-\\d{2}-\\d{2}$',
        titulo: 'Fecha: YYYY-MM-DD',
    },
};

export const obtenerPatronValidacion = (nombre) => {
    if (!nombre || typeof nombre !== 'string') return null;

    if (nombre.includes('email')) return PATRONES_VALIDACION.email;
    if (
        nombre.includes('tel') ||
        nombre.includes('telefono') ||
        nombre.includes('phone')
    )
        return PATRONES_VALIDACION.telefono;
    if (
        nombre.includes('cp') ||
        nombre.includes('codigo_postal') ||
        nombre.includes('postal')
    )
        return PATRONES_VALIDACION.codigoPostal;
    if (
        nombre.includes('numero_documento') ||
        nombre === 'dni' ||
        nombre.includes('nif') ||
        nombre.includes('nie')
    )
        return PATRONES_VALIDACION.dniNie;
    if (nombre.includes('pasaporte') || nombre.includes('passport'))
        return PATRONES_VALIDACION.pasaporte;
    if (nombre === 'name' || nombre.includes('nombre'))
        return PATRONES_VALIDACION.nombre;
    if (nombre.includes('ciudad') || nombre.includes('city'))
        return PATRONES_VALIDACION.ciudad;
    if (nombre.includes('pais') || nombre.includes('nacionalidad'))
        return PATRONES_VALIDACION.pais;
    if (
        nombre === 'numero' ||
        nombre.includes('numero_') ||
        nombre.endsWith('_num')
    )
        return PATRONES_VALIDACION.numero;
    if (
        nombre.includes('localizador') ||
        nombre.includes('localizador_reserva') ||
        nombre === 'localizador'
    )
        return PATRONES_VALIDACION.localizador;
    if (
        nombre.includes('precio') ||
        nombre.includes('importe') ||
        nombre.includes('monto') ||
        nombre.includes('tarifa') ||
        nombre.includes('total')
    )
        return PATRONES_VALIDACION.precio;
    if (
        nombre.includes('capacidad') ||
        nombre.includes('cantidad') ||
        nombre.includes('personas') ||
        nombre.includes('adult') ||
        nombre.includes('nino') ||
        nombre.includes('niños')
    )
        return PATRONES_VALIDACION.capacidad;
    if (nombre.includes('fecha') || nombre.includes('date'))
        return PATRONES_VALIDACION.fecha;

    return null;
};

export const validarDniNIE = (value) => {
    if (!value) return false;
    const v = value.toString().toUpperCase().replace(/[\s-]/g, '');
    const nieMap = { X: '0', Y: '1', Z: '2' };
    let numero = null;

    if (/^[XYZ]\d{7}[A-Z]$/.test(v)) {
        numero = (nieMap[v[0]] || v[0]) + v.slice(1, 8);
    } else if (/^\d{8}[A-Z]$/.test(v)) {
        numero = v.slice(0, 8);
    } else {
        return false;
    }

    const letra = v.slice(-1);
    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const idx = parseInt(numero, 10) % 23;
    return letras.charAt(idx) === letra;
};

export const valorCaracterMRZ = (ch) => {
    if (ch === '<') return 0;
    if (/[0-9]/.test(ch)) return parseInt(ch, 10);
    const code = ch.toUpperCase().charCodeAt(0);
    if (code >= 65 && code <= 90) return code - 55; // A=10 ... Z=35
    return 0;
};

export const calcularDigitoControlMRZ = (s) => {
    const pesos = [7, 3, 1];
    let suma = 0;
    for (let i = 0; i < s.length; i++) {
        const v = valorCaracterMRZ(s[i]);
        suma += v * pesos[i % 3];
    }
    return (suma % 10).toString();
};

export const validarPasaporteMRZ = (value) => {
    if (!value) return false;
    const v = value
        .toString()
        .toUpperCase()
        .replace(/\s+/g, '')
        .replace(/-/g, '');

    // Validación con dígito de control
    if (/^[A-Z0-9<]+\d$/.test(v)) {
        const cuerpo = v.slice(0, -1);
        const cheque = v.slice(-1);
        const cd = calcularDigitoControlMRZ(cuerpo);
        return cd === cheque;
    }

    // Validaciones básicas
    if (/^[A-Z0-9]{5,20}$/.test(v)) return true;
    if (/^[A-Z]{3}\d{6}$/.test(v)) return true;

    return false;
};

export const obtenerMensajeValidacion = (nombre, tituloPersonalizado) => {
    if (tituloPersonalizado) return tituloPersonalizado;

    const patron = obtenerPatronValidacion(nombre);
    return patron ? patron.titulo : 'Valor no válido';
};
