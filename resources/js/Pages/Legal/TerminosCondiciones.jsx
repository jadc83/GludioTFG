import GuestLayout from '@/Layouts/GuestLayout';

export default function TerminosCondiciones() {
    return (
        <GuestLayout>
            <div className="min-h-screen bg-gris py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-gray-100 p-8">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Términos y Condiciones</h1>
                        <p className="text-gray-600">Última actualización: 8 de enero de 2026</p>
                    </div>

                    {/* Contenido */}
                    <div className="space-y-12">
                        {/* 1. Aceptación de Términos */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-6">1. Aceptación de Términos</h2>
                            <p className="text-gray-700 leading-relaxed">
                                Al acceder y utilizar este sitio web y realizar una reserva, aceptas completamente estos términos y condiciones. Si no estás de acuerdo con alguna parte de estos términos, no deberías utilizar nuestros servicios.
                            </p>
                        </section>

                        {/* 2. Política de Cancelación */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-6">2. Política de Cancelación</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Puedes cancelar tu reserva sin cargo hasta <strong>48 horas antes</strong> de tu check-in.
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-gray-700">
                                <li>
                                    <strong>Cancelación antes de 48h:</strong> Reembolso del 100% del monto pagado
                                </li>
                                <li>
                                    <strong>Cancelación dentro de 48h:</strong> Se retiene el 50% de la reserva
                                </li>
                                <li>
                                    <strong>No show (sin presentarse):</strong> Se retiene el 100% de la reserva
                                </li>
                            </ul>
                        </section>

                        {/* 3. Condiciones de Reserva */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-6">3. Condiciones de Reserva</h2>
                            <ul className="space-y-3 text-gray-700">
                                <li className="flex gap-3">
                                    <span className="text-[#7a0202] font-bold">•</span>
                                    <span>Una reserva se confirma solo después de recibir el pago completo o el compromiso de pago en recepción</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-[#7a0202] font-bold">•</span>
                                    <span>El cliente es responsable de proporcionar información de contacto correcta</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-[#7a0202] font-bold">•</span>
                                    <span>Las reservas deben ser para uso personal y no comercial</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-[#7a0202] font-bold">•</span>
                                    <span>El acceso a las habitaciones no está permitido antes de las 15:00 (check-in)</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-[#7a0202] font-bold">•</span>
                                    <span>La salida debe realizarse antes de las 11:00 (check-out)</span>
                                </li>
                            </ul>
                        </section>

                        {/* 4. Métodos de Pago */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-6">4. Métodos de Pago</h2>
                            <p className="text-gray-700 mb-4">
                                Ofrecemos dos opciones de pago:
                            </p>
                            <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="font-semibold text-gray-900 mb-2">💳 Pago con Tarjeta (Stripe)</p>
                                    <p className="text-gray-700 text-sm">
                                        El pago se procesa de forma segura a través de Stripe. Tus datos de tarjeta nunca se almacenan en nuestros servidores.
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="font-semibold text-gray-900 mb-2">🏨 Pago en Recepción</p>
                                    <p className="text-gray-700 text-sm">
                                        Puedes pagar en efectivo o tarjeta al momento de tu llegada. La reserva se mantiene con tu nombre y se confirmará mediante correo electrónico.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 5. Responsabilidades del Huésped */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-6">5. Responsabilidades del Huésped</h2>
                            <ul className="space-y-2 text-gray-700">
                                <li className="flex gap-3">
                                    <span className="text-[#7a0202] font-bold">•</span>
                                    <span>Mantener las habitaciones en buen estado</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-[#7a0202] font-bold">•</span>
                                    <span>No fumar en las áreas prohibidas</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-[#7a0202] font-bold">•</span>
                                    <span>Respetar el silencio a partir de las 22:00</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-[#7a0202] font-bold">•</span>
                                    <span>No introducir animales sin autorización previa</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-[#7a0202] font-bold">•</span>
                                    <span>Reportar cualquier daño o problema inmediatamente a recepción</span>
                                </li>
                            </ul>
                        </section>

                        {/* 6. Limitación de Responsabilidad */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-6">6. Limitación de Responsabilidad</h2>
                            <p className="text-gray-700 leading-relaxed">
                                No nos hacemos responsables por pérdida, robo o daño de artículos personales en las habitaciones. Se recomienda el uso de la caja de seguridad disponible en recepción. Tampoco somos responsables por interrupciones en servicios (internet, agua, electricidad) por causa mayor.
                            </p>
                        </section>

                        {/* 7. Privacidad y Datos Personales */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-6">7. Privacidad y Datos Personales</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Tus datos personales se recopilan solo para procesar tu reserva y se tratarán de acuerdo con la Ley Orgánica de Protección de Datos (RGPD). No compartiremos tus datos con terceros sin tu consentimiento.
                            </p>
                            <p className="text-gray-700 text-sm">
                                Para más información sobre cómo protegemos tus datos, consulta nuestra <a href="/privacidad" className="text-[#7a0202] hover:underline font-medium">Política de Privacidad</a>.
                            </p>
                        </section>

                        {/* 8. Modificaciones de Términos */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-6">8. Modificaciones de Términos</h2>
                            <p className="text-gray-700 leading-relaxed">
                                Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente tras su publicación en este sitio.
                            </p>
                        </section>

                        {/* 9. Contacto */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-6">9. Contacto</h2>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-gray-900 font-semibold mb-3">¿Preguntas sobre nuestros términos?</p>
                                <ul className="space-y-2 text-gray-700 text-sm">
                                    <li><strong>Email:</strong> info@gludit.com</li>
                                    <li><strong>Teléfono:</strong> +34 XXX XXX XXX</li>
                                    <li><strong>Horario:</strong> Lunes a Viernes, 9:00 - 18:00</li>
                                </ul>
                            </div>
                        </section>
                    </div>

                    {/* Footer con botón volver */}
                    <div className="mt-12 pt-8 border-t border-gray-200 flex justify-center">
                        <button onClick={() => window.close()} className="inline-flex items-center justify-center rounded-lg bg-black text-white px-6 py-3 font-semibold text-sm uppercase tracking-wider hover:bg-[#7a0202] transition-colors">
                            ← Volver
                        </button>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
