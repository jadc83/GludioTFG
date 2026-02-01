import { useState } from 'react';
import { CreditCardIcon } from '@heroicons/react/24/outline';

const detectarTarjeta = (numero) => {
    const num = numero.replace(/\s/g, '');
    if (!num) return { tipo: '', color: '', logo: '' };

    if (/^4/.test(num)) return { tipo: 'VISA', color: '#1A1F71', logo: '💳' };
    if (/^5[1-5]/.test(num)) return { tipo: 'MASTERCARD', color: '#EB001B', logo: '🔴' };
    if (/^3[47]/.test(num)) return { tipo: 'AMEX', color: '#006FCF', logo: '💳' };
    if (/^6(?:011|5)/.test(num)) return { tipo: 'DISCOVER', color: '#FF6000', logo: '🔷' };
    if (/^(?:2131|1800|35\d{3})/.test(num)) return { tipo: 'JCB', color: '#0066B2', logo: '💳' };
    if (/^63[0-9]|^(606282|627780)/.test(num)) return { tipo: 'LINK', color: '#00A651', logo: '🔗' };

    return { tipo: 'TARJETA', color: '#666', logo: '💳' };
};

export default function Tarjeta3D({
    formData = {},
    onInputChange = () => {},
    onCardChange = () => {}
}) {
    const tipoTarjeta = detectarTarjeta(formData.numeroTarjeta || '');

    return (
        <div className="w-full">
            {/* TARJETA UNIFICADA - VISUAL + FORMULARIO */}
            <div className="rounded-2xl bg-gradient-to-br from-[#920303] to-[#6b0202] text-white shadow-2xl border border-[#c41e3a] overflow-hidden">

                {/* SECCIÓN SUPERIOR: VISUALIZACIÓN DE LA TARJETA */}
                <div className="p-8 border-b border-white/10">
                    {/* ENCABEZADO */}
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <div className="text-xs opacity-60 font-bold tracking-widest mb-1">HOTEL GLUDIO</div>
                            <div className="text-xl font-black">GLUDIO CARD</div>
                        </div>
                        <CreditCardIcon className="h-8 w-8 opacity-40" />
                    </div>

                    {/* NÚMERO DE TARJETA */}
                    <div className="mb-10">
                        <div className="text-sm opacity-50 font-mono mb-2">NÚMERO DE TARJETA</div>
                        <div className="flex items-center justify-between">
                            <input
                                type="text"
                                placeholder="0000 0000 0000 0000"
                                value={formData.numeroTarjeta ? formData.numeroTarjeta.replace(/(.{4})/g, '$1 ') : ''}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\s/g, '').slice(0, 16);
                                    onCardChange('numeroTarjeta', val);
                                }}
                                maxLength="19"
                                className="flex-1 bg-white rounded px-3 py-2 text-xl font-mono tracking-[0.2em] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50 transition placeholder-gray-400"
                            />
                            {tipoTarjeta.tipo && (
                                <div className="ml-4 px-3 py-1 rounded bg-white/10 border border-white/20 text-xs font-bold text-white flex items-center gap-1">
                                    <span>{tipoTarjeta.logo}</span>
                                    {tipoTarjeta.tipo}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* FILA: TITULAR + VENCIMIENTO + CVV */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <div className="text-xs opacity-50 font-bold tracking-widest mb-2">TITULAR</div>
                            <input
                                type="text"
                                placeholder="TU NOMBRE"
                                value={formData.nombreTitular || ''}
                                onChange={(e) => onCardChange('nombreTitular', e.target.value)}
                                className="w-full bg-white rounded px-3 py-2 text-sm font-bold uppercase text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50 transition placeholder-gray-400"
                            />
                        </div>
                        <div>
                            <div className="text-xs opacity-50 font-bold tracking-widest mb-2">VENCIMIENTO</div>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    placeholder="MM"
                                    value={formData.mesVencimiento || ''}
                                    onChange={(e) => onCardChange('mesVencimiento', e.target.value.slice(0, 2))}
                                    maxLength="2"
                                    className="w-12 bg-white rounded px-2 py-2 text-sm font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50 transition placeholder-gray-400 text-center"
                                />
                                <span className="text-white/50">/</span>
                                <input
                                    type="text"
                                    placeholder="YY"
                                    value={formData.anoVencimiento || ''}
                                    onChange={(e) => onCardChange('anoVencimiento', e.target.value.slice(0, 2))}
                                    maxLength="2"
                                    className="w-12 bg-white rounded px-2 py-2 text-sm font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50 transition placeholder-gray-400 text-center"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="text-xs opacity-50 font-bold tracking-widest mb-2">CVV</div>
                            <input
                                type="text"
                                placeholder="•••"
                                value={formData.cvv || ''}
                                onChange={(e) => onCardChange('cvv', e.target.value.slice(0, 3))}
                                maxLength="3"
                                className="w-16 bg-white rounded px-2 py-2 text-sm font-mono font-bold tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50 transition placeholder-gray-400 text-center"
                            />
                        </div>
                    </div>
                </div>

                {/* SECCIÓN INFERIOR: FORMULARIO DE FACTURACIÓN Y PAGO */}
                <div className="p-8 bg-black/20 space-y-6">
                    {/* DETALLES DE FACTURACIÓN */}
                    <div>
                        <h3 className="text-sm font-black text-white/80 uppercase mb-4 tracking-widest">Información de Facturación</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-white/60 uppercase mb-2 tracking-wider">Email</label>
                                <input
                                    type="email"
                                    placeholder="tu@email.com"
                                    value={formData.email || ''}
                                    onChange={(e) => onInputChange('email', e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm font-bold text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/60 uppercase mb-2 tracking-wider">Dirección</label>
                                <input
                                    type="text"
                                    placeholder="Tu dirección completa"
                                    value={formData.direccion || ''}
                                    onChange={(e) => onInputChange('direccion', e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm font-bold text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/60 uppercase mb-2 tracking-wider">Ciudad</label>
                                <input
                                    type="text"
                                    placeholder="Ciudad"
                                    value={formData.ciudad || ''}
                                    onChange={(e) => onInputChange('ciudad', e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm font-bold text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/60 uppercase mb-2 tracking-wider">Código Postal</label>
                                <input
                                    type="text"
                                    placeholder="CP"
                                    value={formData.codigoPostal || ''}
                                    onChange={(e) => onInputChange('codigoPostal', e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm font-bold text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
