export default function ReservaFondo() {
    return (
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-white via-white/80 to-transparent" />
            <div className="bg-[#7a0202]/6 absolute inset-0 z-10 mix-blend-multiply" />
            <img
                src="https://images.unsplash.com/photo-1505691723518-36a6cc7ec9b0?q=80&w=2070&auto=format&fit=crop"
                className="opacity-12 animate-slow-zoom h-full w-full scale-110 object-cover"
                alt="Hotel Background"
            />
            <style dangerouslySetInnerHTML={{ __html: `@keyframes slow-zoom { 0% { transform: scale(1); } 100% { transform: scale(1.1); } } .animate-slow-zoom { animation: slow-zoom 20s infinite alternate ease-in-out; }` }} />
        </div>
    );
}
