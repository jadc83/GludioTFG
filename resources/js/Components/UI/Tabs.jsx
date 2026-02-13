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
                className={`flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-2 text-xs font-medium transition-all duration-200 md:gap-2 md:px-4 md:text-sm ${isActive ? 'bg-white text-[#920303] shadow-sm ring-1 ring-black/5' : 'text-[#6b1212] hover:bg-gray-200/50 hover:text-[#920303]'}`}
                role="tab"
                aria-selected={isActive ? 'true' : 'false'}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
            >
                <Icon className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
            </button>
        );
    };

    const containerClass =
        variant === 'profile'
            ? 'perfil-tabs mb-8'
            : className || 'flex flex-wrap justify-center gap-1 md:gap-2';

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
