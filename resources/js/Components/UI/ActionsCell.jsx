import React from 'react';
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function ActionsCell({ onView, onEdit }) {
    return (
        <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <button onClick={onView} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
                <EyeIcon className="h-5 w-5" />
            </button>
            {onEdit ? (
                <button onClick={onEdit} className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-[#7a0202]">
                    <PencilIcon className="h-5 w-5" />
                </button>
            ) : null}
        </div>
    );
}
