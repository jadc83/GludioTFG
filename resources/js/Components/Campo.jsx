const Campo = ({ id, label, as = 'input', error, classNameExtra = '', children, ...props }) => {

    const InputTag = as;

    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700" htmlFor={id}>
                {label}
            </label>
            <InputTag id={id} name={id}
                className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${error ? 'border-red-500' : ''} ${classNameExtra}`}
                {...props}>
                {children}
            </InputTag>
            {error && (
                <span className="text-xs text-red-500">
                    {Array.isArray(error) ? error[0] : error}
                </span>
            )}
        </div>
    );
};

export default Campo;
