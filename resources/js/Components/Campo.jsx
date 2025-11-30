import { Fragment } from 'react';

const Campo = ({ id, label, as = 'input', error, classNameExtra = '', children, ...props }) => {
    const InputTag = as;
    const baseClass = as === 'textarea' ? 'campo-textarea' : as === 'select'
        ? 'campo-select' : 'campo-input';

    return (
        <div className="campo">
            <label className="campo-label" htmlFor={id}>
                <span className="campo-label-text">{label}</span>
            </label>
            <InputTag
                id={id}
                name={id}
                className={`${baseClass} ${error ? 'error' : ''} ${classNameExtra}`}
                {...props}
            >
                {children}
            </InputTag>
            {error && (
                <span className="campo-error">
                    {Array.isArray(error) ? error[0] : error}
                </span>
            )}
        </div>
    );
};

export default Campo;
