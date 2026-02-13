export default function HabitacionItem({ hab }) {
    return (
        <div className="flex justify-between rounded-md bg-gray-50 p-2">
            <span className="text-gray-700">
                {hab.tipo} - Habitación {hab.numero}
            </span>
            <span className="font-semibold text-gray-800">
                {hab.precio_formateado || hab.precio}
            </span>
        </div>
    );
}
