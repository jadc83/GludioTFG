import React, { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import { obtenerPatronValidacion, validarDniNIE, validarPasaporteMRZ, obtenerMensajeValidacion } from '../utils/validaciones';

const Campo = forwardRef(({ id, label, as = 'input', error, className = '', containerClassName = 'flex flex-col gap-1', labelClassName = 'text-xs font-semibold text-gray-700',
    errorClassName = 'text-xs text-red-500', unstyled = false, autoFocus = false, children, ...props}, ref) => {

    const InputTag = as;
    const defaultInputClasses = `w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${error ? 'border-red-500' : ''}`;
    const inputClassName = unstyled ? className : `${defaultInputClasses} ${className}`.trim();
    const voidElements = new Set(['input', 'img', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr']);
    const esVoid = typeof InputTag === 'string' && voidElements.has(InputTag);
    const descritoPor = error ? `${id}-error` : undefined;

    const referenciaLocal = useRef(null);
    useImperativeHandle(ref, () => ({ focus: () => referenciaLocal.current?.focus() }));
    useEffect(() => {
        if (autoFocus) referenciaLocal.current?.focus();
    }, [autoFocus]);

    // children real (soporta pasar hijos por JSX o por prop `children`)
    const contenido = children;

    const nombre = (props.name || id || '').toString().toLowerCase();
    if (!props.pattern) {
        const patronValidacion = obtenerPatronValidacion(nombre);
        if (patronValidacion) {
            props.pattern = patronValidacion.patron;
            props.title = props.title || patronValidacion.titulo;
        }
    }

    // Handlers para mensajes de validación personalizados
    const onInvalidOrigen = props.onInvalid;
    const onInputOrigen = props.onInput;
    const onBlurOrigen = props.onBlur;
    const mensaje = obtenerMensajeValidacion(nombre, props.title);
    const esCampoDNI = nombre.includes('numero_documento') || nombre === 'dni' || nombre.includes('nif') || nombre.includes('nie');
    const esCampoPasaporte = nombre.includes('pasaporte') || nombre.includes('passport');

    props.onInvalid = (e) => {
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

    props.onInput = (e) => {
        try { if (typeof onInputOrigen === 'function') onInputOrigen(e); } catch (err) {}
        try { e.target.setCustomValidity(''); } catch (err) {}
    };

    props.onBlur = (e) => {
        try { if (typeof onBlurOrigen === 'function') onBlurOrigen(e); } catch (err) {}
        try {
            if (esCampoDNI) {
                const ok = validarDniNIE(e.target.value);
                e.target.setCustomValidity(ok ? '' : 'DNI/NIE no válido');
            }
            if (esCampoPasaporte) {
                const ok = validarPasaporteMRZ(e.target.value);
                e.target.setCustomValidity(ok ? '' : 'Pasaporte no válido');
            }
        } catch (err) {}
    };

    return (
        <div className={containerClassName}>
            {label && (
                <label className={labelClassName} htmlFor={id}>
                    {label}
                </label>
            )}
            {esVoid ? (
                <InputTag id={id} name={props.name || id} ref={referenciaLocal} className={inputClassName} aria-invalid={!!error} aria-describedby={descritoPor} {...props} />
            ) : (
                <InputTag id={id} name={props.name || id} ref={referenciaLocal} className={inputClassName} aria-invalid={!!error} aria-describedby={descritoPor} {...props}>
                    {contenido}
                </InputTag>
            )}
            {error && (
                <span id={descritoPor} className={errorClassName}>
                    {Array.isArray(error) ? error[0] : error}
                </span>
            )}
        </div>
    );
});

Campo.displayName = 'Campo';

export default Campo;
