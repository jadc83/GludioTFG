export default function Tarjetas() {
  const tarjetas = [
    {
      color: 'text-amber-600',
      icon: (
        <div>
          <rect x="2" y="10" width="20" height="8" rx="3" fill="currentColor" opacity="0.2" />
          <path d="M3 18V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12" />
        </div>
      ),
      titulo: 'Habitaciones de lujo',
      descripcion:
        'Espacios amplios, diseño elegante y todas las comodidades para el máximo confort.',
    },
    {
      color: 'text-blue-500',
      icon: (
        <div>
          <ellipse cx="12" cy="16" rx="8" ry="2.5" fill="currentColor" opacity="0.2" />
          <path d="M4 16c0-3 3.6-8 8-8s8 5 8 8" />
        </div>
      ),
      titulo: 'Piscina climatizada',
      descripcion:
        'Piscina interior y exterior disponible todo el año para relajarse en cualquier estación.',
    },
    {
      color: 'text-green-600',
      icon: (
        <div>
          <circle cx="12" cy="8" r="3" fill="currentColor" opacity="0.2" />
          <path d="M12 11v5m-4 0h8" />
        </div>
      ),
      titulo: 'Restaurante gourmet',
      descripcion:
        'Disfruta de la alta cocina internacional sin salir del hotel, con ingredientes frescos y presentación impecable.',
    },
    {
      color: 'text-purple-700',
      icon: (
        <div>
          <path d="M2 8a18 18 0 0 1 20 0" />
          <path d="M5 12a12 12 0 0 1 14 0" />
          <circle cx="12" cy="17" r="2" fill="currentColor" />
        </div>
      ),
      titulo: 'Wifi ultra-rápido',
      descripcion:
        'Conexión estable y veloz en todas las instalaciones, perfecta para trabajo o entretenimiento sin límites.',
    },
  ];

  return (
    <div className="w-full bg-gris pt-4 pb-6 px-6 flex justify-center">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-[72rem]">
        {tarjetas.map(({ color, icon, titulo, descripcion }, idx) => (
          <div key={idx} className="rounded-xl flex flex-col items-center py-4 mx-1 max-w-[18rem]">
            <svg className={`w-10 h-10 mb-3 ${color}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {icon}
            </svg>
            <h2 className="text-base font-semibold mb-1 text-center">{titulo}</h2>
            <p className="text-sm text-gray-600 text-center leading-snug">{descripcion}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
