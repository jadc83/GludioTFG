import React, { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';

const Campo = forwardRef(({
    id,
    label,
    as = 'input',
    error,
    claseExtra = '',
    clase = '',
    hijos,
    claseContenedor = 'flex flex-col gap-1',
    claseEtiqueta = 'text-xs font-semibold text-gray-700',
    claseError = 'text-xs text-red-500',
    sinEstilosPorDefecto = false,
    estaFocalizado = false,
    ...props
}, ref) => {

    const InputTag = as;
    const defaultInputClasses = `w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${error ? 'border-red-500' : ''}`;
    const clasesCombinadas = sinEstilosPorDefecto ? `${clase} ${claseExtra}`.trim() : `${defaultInputClasses} ${clase} ${claseExtra}`.trim();
    const voidElements = new Set(['input', 'img', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr']);
    const esVoid = typeof InputTag === 'string' && voidElements.has(InputTag);
    const descritoPor = error ? `${id}-error` : undefined;

    // Validador DNI/NIE
    const validarDniNIE = (value) => {
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

    // Validador MRZ (pasaporte)
    const valorCaracter = (ch) => {
        if (ch === '<') return 0;
        if (/[0-9]/.test(ch)) return parseInt(ch, 10);
        const code = ch.toUpperCase().charCodeAt(0);
        if (code >= 65 && code <= 90) return code - 55; // A=10 ... Z=35
        return 0;
    };

    const calcularDigitoControl = (s) => {
        const pesos = [7, 3, 1];
        let suma = 0;
        for (let i = 0; i < s.length; i++) {
            const v = valorCaracter(s[i]);
            suma += v * pesos[i % 3];
        }
        return (suma % 10).toString();
    };

    const validarPasaporteMRZ = (value) => {
        if (!value) return false;
        const v = value.toString().toUpperCase().replace(/\s+/g, '').replace(/-/g, '');
        if (/^[A-Z0-9<]+\d$/.test(v)) {
            const cuerpo = v.slice(0, -1);
            const cheque = v.slice(-1);
            const cd = calcularDigitoControl(cuerpo);
            return cd === cheque;
        }
        if (/^[A-Z0-9]{5,20}$/.test(v)) return true;
        if (/^[A-Z]{3}\d{6}$/.test(v)) return true;
        return false;
    };

    const referenciaLocal = useRef(null);
    useImperativeHandle(ref, () => ({ focus: () => referenciaLocal.current?.focus() }));
    useEffect(() => {
        if (estaFocalizado) referenciaLocal.current?.focus();
    }, [estaFocalizado]);

    // children real (soporta pasar hijos por JSX o por prop `hijos`)
    const contenido = typeof hijos !== 'undefined' ? hijos : props.children;

    const atributos = { ...props };
    // eliminar props en español y variantes en inglés para que no lleguen al DOM
    delete atributos.clase;
    delete atributos.claseExtra;
    delete atributos.claseContenedor;
    delete atributos.claseEtiqueta;
    delete atributos.claseError;
    delete atributos.sinEstilosPorDefecto;
    delete atributos.estaFocalizado;
    delete atributos.isFocused;
    delete atributos.isfocused;
    delete atributos.focused;
    delete atributos.hijos;
    delete atributos.children;

    // Asegurar que inputs controlados no cambien de uncontrolled a controlled.
    // Para inputs (excepto file/checkbox/radio) y para select/textarea, si `value` es undefined o null lo normalizamos a cadena vacía.
    const inputType = atributos.type;
    if (typeof InputTag === 'string') {
        if (InputTag === 'input') {
            if (!['file', 'checkbox', 'radio'].includes(inputType)) {
                if (atributos.value === undefined || atributos.value === null) atributos.value = '';
            }
        } else if (InputTag === 'select' || InputTag === 'textarea') {
            if (atributos.value === undefined || atributos.value === null) atributos.value = '';
        }
    }

    const nombre = (atributos.name || id || '').toString().toLowerCase();
    if (!atributos.pattern) {
        if (nombre.includes('email')) {
            atributos.pattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
            atributos.title = atributos.title || 'Introduce un email válido';
        }
        if (nombre.includes('tel') || nombre.includes('telefono') || nombre.includes('phone')) {
            // Evitar establecer pattern automático para teléfonos (problemas de compatibilidad
            // con ciertos motores/flags). Dejar sólo el title para ayudar al usuario.
            atributos.title = atributos.title || 'Teléfono: solo números, espacios, guiones o paréntesis';
        }
        if (nombre.includes('cp') || nombre.includes('codigo_postal') || nombre.includes('postal')) {
            atributos.pattern = atributos.pattern || '^\\d{4,6}$';
            atributos.title = atributos.title || 'Código postal: 4 a 6 dígitos';
        }
        if (nombre.includes('numero_documento') || nombre === 'dni' || nombre.includes('nif') || nombre.includes('nie')) {
            atributos.pattern = atributos.pattern || '([XxYyZz]\\d{7}[A-Za-z]|\\d{8}[A-Za-z])';
            atributos.title = atributos.title || 'DNI/NIE: formato 8 dígitos + letra o NIE (X/Y/Z + 7 dígitos + letra)';
        }
        if (nombre.includes('pasaporte') || nombre.includes('passport')) {
            atributos.pattern = atributos.pattern || '^[A-Za-z0-9\\-\\s]{5,20}$';
            atributos.title = atributos.title || 'Pasaporte: letras y números (5-20 caracteres)';
        }
        if (nombre === 'name' || nombre.includes('nombre')) {
            atributos.pattern = atributos.pattern || "^[A-Za-zÀ-ÖØ-öø-ÿ'´`\\- ]{2,60}$";
            atributos.title = atributos.title || 'Nombre: solo letras, espacios y guiones';
        }
        if (nombre.includes('ciudad') || nombre.includes('city')) {
            atributos.pattern = atributos.pattern || "^[A-Za-zÀ-ÖØ-öø-ÿ'´`\\- ]{2,60}$";
            atributos.title = atributos.title || 'Ciudad: solo letras y espacios';
        }
        if (nombre.includes('pais') || nombre.includes('nacionalidad')) {
            atributos.pattern = atributos.pattern || "^[A-Za-zÀ-ÖØ-öø-ÿ'´`\\- ]{2,60}$";
            atributos.title = atributos.title || 'Introduce un país válido';
        }
        if (nombre === 'numero' || nombre.includes('numero_') || nombre.endsWith('_num')) {
            atributos.pattern = atributos.pattern || '^\\d+$';
            atributos.title = atributos.title || 'Solo números';
        }
        if (nombre.includes('localizador') || nombre.includes('localizador_reserva') || nombre === 'localizador') {
            atributos.pattern = atributos.pattern || '^[A-Z0-9\-]{4,20}$';
            atributos.title = atributos.title || 'Localizador: letras mayúsculas, números o guión';
        }
        if (nombre.includes('precio') || nombre.includes('importe') || nombre.includes('monto') || nombre.includes('tarifa') || nombre.includes('total')) {
            atributos.pattern = atributos.pattern || '^\\d{1,9}(?:[\\.,]\\d{1,2})?$';
            atributos.title = atributos.title || 'Número: opcional decimales (ej. 123.45)';
        }
        if (nombre.includes('capacidad') || nombre.includes('cantidad') || nombre.includes('personas') || nombre.includes('adult') || nombre.includes('nino') || nombre.includes('niños')) {
            atributos.pattern = atributos.pattern || '^\\d+$';
            atributos.title = atributos.title || 'Introduce un número entero';
        }
        if (nombre.includes('fecha') || nombre.includes('date')) {
            atributos.pattern = atributos.pattern || '^\\d{4}-\\d{2}-\\d{2}$';
            atributos.title = atributos.title || 'Fecha: YYYY-MM-DD';
        }
    }

    // Handlers para mensajes de validación personalizados
    const onInvalidOrigen = atributos.onInvalid;
    const onInputOrigen = atributos.onInput;
    const onBlurOrigen = atributos.onBlur;
    const mensaje = atributos.title || 'Valor no válido';
    const esCampoDNI = nombre.includes('numero_documento') || nombre === 'dni' || nombre.includes('nif') || nombre.includes('nie');

    atributos.onInvalid = (e) => {
        try { if (typeof onInvalidOrigen === 'function') onInvalidOrigen(e); } catch (err) {}
        try {
            if (esCampoDNI) {
                const ok = validarDniNIE(e.target.value);
                e.target.setCustomValidity(ok ? '' : 'DNI/NIE no válido');
            } else {
                e.target.setCustomValidity(mensaje);
            }
        } catch (err) {}
    };

    atributos.onInput = (e) => {
        try { if (typeof onInputOrigen === 'function') onInputOrigen(e); } catch (err) {}
        try { e.target.setCustomValidity(''); } catch (err) {}
    };

    atributos.onBlur = (e) => {
        try { if (typeof onBlurOrigen === 'function') onBlurOrigen(e); } catch (err) {}
        try {
            if (esCampoDNI) {
                const ok = validarDniNIE(e.target.value);
                e.target.setCustomValidity(ok ? '' : 'DNI/NIE no válido');
            }
            if (nombre.includes('pasaporte') || nombre.includes('passport')) {
                const ok = validarPasaporteMRZ(e.target.value);
                e.target.setCustomValidity(ok ? '' : 'Pasaporte no válido');
            }
        } catch (err) {}
    };

    return (
        <div className={claseContenedor}>
            {label && (
                <label className={claseEtiqueta} htmlFor={id}>
                    {label}
                </label>
            )}
            {esVoid ? (
                <InputTag id={id} name={atributos.name || id} ref={referenciaLocal} className={clasesCombinadas} aria-invalid={!!error} aria-describedby={descritoPor} {...atributos} />
            ) : (
                <InputTag id={id} name={atributos.name || id} ref={referenciaLocal} className={clasesCombinadas} aria-invalid={!!error} aria-describedby={descritoPor} {...atributos}>
                    {contenido}
                </InputTag>
            )}
            {error && (
                <span id={descritoPor} className={claseError}>
                    {Array.isArray(error) ? error[0] : error}
                </span>
            )}
        </div>
    );
});

Campo.displayName = 'Campo';

export default Campo;
