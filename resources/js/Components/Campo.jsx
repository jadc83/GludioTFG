import React, { forwardRef } from 'react';

const Campo = forwardRef(({
    id,
    label,
    as = 'input',
    error,
    classNameExtra = '',
    className = '',
    children,
    wrapperClass = 'flex flex-col gap-1',
    labelClass = 'text-xs font-semibold text-gray-700',
    errorClass = 'text-xs text-red-500',
    noDefaultStyles = false,
    ...props
}, ref) => {

    const InputTag = as;
    const defaultInputClasses = `w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${error ? 'border-red-500' : ''}`;
    const mergedClassName = noDefaultStyles ? `${className} ${classNameExtra}`.trim() : `${defaultInputClasses} ${className} ${classNameExtra}`.trim();
    const voidElements = new Set(['input', 'img', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr']);
    const isVoid = typeof InputTag === 'string' && voidElements.has(InputTag);
    const describedBy = error ? `${id}-error` : undefined;

    return (
        <div className={wrapperClass}>
            <label className={labelClass} htmlFor={id}>
                {label}
            </label>
            {isVoid ? (
                <InputTag id={id} name={id} ref={ref} className={mergedClassName} aria-invalid={!!error} aria-describedby={describedBy} {...props} />
            ) : (
                <InputTag id={id} name={id} ref={ref} className={mergedClassName} aria-invalid={!!error} aria-describedby={describedBy} {...props}>
                    {children}
                </InputTag>
            )}
            {error && (
                <span id={describedBy} className={errorClass}>
                    {Array.isArray(error) ? error[0] : error}
                </span>
            )}
        </div>
    );
});

Campo.displayName = 'Campo';

export default Campo;
