export default function Tabs({
    tabs = [],
    active,
    onChange = () => {},
    variant = 'default',
    className = '',
}) {
    const renderButton = (tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;

        if (variant === 'profile') {
            return (
                <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    onClick={() => onChange(tab.id)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[12px] font-black uppercase tracking-widest transition-all duration-300 ${isActive ? 'active' : ''}`}
                    role="tab"
                    aria-selected={isActive ? 'true' : 'false'}
                    aria-controls={`panel-${tab.id}`}
                    tabIndex={isActive ? 0 : -1}
                >
                        <span className={`flex h-8 w-8 items-center justify-center rounded-md ${isActive ? 'bg-white/10' : 'bg-white/0'}`}>
                            <Icon
                                className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400'}`}
                            />
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="whitespace-nowrap truncate max-w-[9rem] md:max-w-none">{tab.label}</span>
                            {typeof tab.count === 'number' ? (
                                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/90">
                                    {tab.count}
                                </span>
                            ) : null}
                        </span>
                </button>
            );
        }

        // panel / default variant
        return (
            <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => onChange(tab.id)}
                className={`flex-1 min-w-0 flex items-center justify-center gap-1 rounded-md px-1 py-1 text-[10px] font-medium transition-all duration-200 md:gap-1 md:px-2 md:text-[11px] ${isActive ? 'bg-white text-[#920303] shadow-sm ring-1 ring-black/5' : 'text-[#6b1212] hover:bg-gray-200/50 hover:text-[#920303]'}`}
                role="tab"
                aria-selected={isActive ? 'true' : 'false'}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
            >
                <Icon className="h-3 w-3 md:h-3 md:w-3 flex-shrink-0" />
                <span className="inline-block min-w-0 truncate text-[10px] md:text-[11px] text-center">{tab.label}</span>
            </button>
        );
    };

    const containerClass =
        variant === 'profile'
            ? 'perfil-tabs mb-8'
            :
                  className ||
                  // Forzar disposición horizontal y ocupar todo el ancho
                  'flex w-full flex-row flex-nowrap items-stretch gap-1 md:gap-2';

    return (
        <div
            className={containerClass}
            role="tablist"
            aria-orientation="horizontal"
        >
            {tabs.map((t) => renderButton(t))}
        </div>
    );
}
