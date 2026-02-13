import React from 'react';

export default function TableWrapper({ caption = 'Tabla', children }) {
    return (
        <div className="overflow-x-auto">
            <table className="responsive-table w-full border-collapse text-left" role="table" aria-label={caption}>
                {children}
            </table>
        </div>
    );
}
