import React from 'react';
import PropTypes from 'prop-types';

export default function PaymentButton({ onClick, isDisabled, procesando }) {
    const className =
        'flex w-full items-center justify-center rounded-xl py-3 text-[12px] font-black uppercase tracking-[0.2em] transition-all ' +
        (isDisabled
            ? 'bg-yellow-300 text-white opacity-60 cursor-not-allowed pointer-events-none select-none'
            : 'bg-yellow-600 text-white hover:bg-yellow-700');

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isDisabled}
            aria-disabled={isDisabled}
            tabIndex={isDisabled ? -1 : 0}
            className={className}
        >
            {procesando ? 'Procesando...' : 'Pagar con Stripe (Checkout)'}
        </button>
    );
}

PaymentButton.propTypes = {
    onClick: PropTypes.func.isRequired,
    isDisabled: PropTypes.bool,
    procesando: PropTypes.bool,
};
