import React from 'react';

export default function InputArchivo({ multiple = false, onChange }) {
    return (
        <input type="file" multiple={multiple} onChange={(e) => onChange(Array.from(e.target.files || []))} className="block w-full text-sm text-gray-600" />
    );
}
