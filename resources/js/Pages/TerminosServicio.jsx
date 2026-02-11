import React from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head } from '@inertiajs/react';

export default function TerminosServicio() {
	return (
		<GuestLayout>
			<Head title="Términos del Servicio - Condiciones Generales" />

			<div className="max-w-4xl mx-auto px-6 py-16">
				{/* Encabezado Legal */}
				<div className="border-b border-gray-200 pb-8 mb-12">
					<h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">Términos y Condiciones</h1>
					<p className="mt-4 text-sm text-gray-500 font-medium">
						Contrato de servicios de alojamiento y condiciones generales de uso de la plataforma.
						Última revisión: Febrero 2026.
					</p>
				</div>

				<div className="space-y-12 text-gray-700 leading-relaxed text-sm">

					{/* 1. Objeto */}
					<section>
						<h2 className="text-lg font-bold text-gray-900 uppercase mb-4 tracking-wide">1. Objeto y Ámbito de Aplicación</h2>
						<p>
							Las presentes condiciones generales regulan la relación jurídica derivada de los procesos de contratación realizados entre los usuarios
							y <strong>Hotel Gludio</strong>. La formalización de una reserva implica la aceptación plena e incondicional de estas cláusulas en la
							versión publicada en el momento del acceso al sitio web.
						</p>
					</section>

					{/* 2. Condiciones de Reserva */}
					<section>
						<h2 className="text-lg font-bold text-gray-900 uppercase mb-4 tracking-wide">2. Proceso de Reserva y Contratación</h2>
						<p className="mb-4">
							Toda reserva confirmada a través de este portal constituye un contrato vinculante. El usuario declara ser mayor de edad y poseer la
							capacidad legal necesaria para contratar los servicios ofertados.
						</p>
						<ul className="list-disc pl-6 space-y-2 italic">
							<li><strong>Disponibilidad:</strong> Las confirmaciones se emiten en tiempo real. En caso de error técnico en el inventario, el hotel se comunicará en un plazo máximo de 24h para ofrecer una alternativa o el reembolso íntegro.</li>
							<li><strong>Identificación:</strong> Es obligatorio presentar un documento de identidad válido (DNI, NIE o Pasaporte) de todos los ocupantes al momento del check-in, conforme a la normativa de seguridad ciudadana.</li>
						</ul>
					</section>

					{/* 3. Tarifas y Pagos */}
					<section>
						<h2 className="text-lg font-bold text-gray-900 uppercase mb-4 tracking-wide">3. Condiciones Económicas</h2>
						<p>
							Los precios indicados incluyen el IVA aplicable según la legislación vigente. El hotel se reserva el derecho de solicitar una tarjeta de crédito
							como garantía o el pago por adelantado según la tarifa seleccionada (Flexible o No Reembolsable).
						</p>
						<div className="mt-4 p-4 bg-gray-50 border-l-4 border-gray-300">
							<p className="text-xs uppercase font-bold text-gray-900 mb-1">Tasa Turística:</p>
							<p className="text-xs">Los impuestos locales o tasas turísticas adicionales no incluidas en el precio final deberán ser abonados directamente en la recepción del hotel si así lo exige la normativa municipal.</p>
						</div>
					</section>

					{/* 4. Cancelaciones y Desistimiento */}
					<section>
						<h2 className="text-lg font-bold text-gray-900 uppercase mb-4 tracking-wide">4. Política de Cancelación y No-Show</h2>
						<p className="mb-4">El régimen de cancelación está sujeto a la tarifa contratada:</p>
						<ol className="list-decimal pl-6 space-y-3">
							<li><strong>Tarifa Flexible:</strong> Permite cancelación sin costes hasta la fecha y hora indicadas en el bono de reserva.</li>
							<li><strong>Tarifa No Reembolsable:</strong> No admite devolución, modificación ni canje, independientemente de la causa del desistimiento.</li>
							<li><strong>No-Show (No presentación):</strong> Conllevará el cargo del 100% de la primera noche o de la estancia completa según las condiciones específicas de la reserva.</li>
						</ol>
					</section>

					{/* 5. Normas de Estancia */}
					<section>
						<h2 className="text-lg font-bold text-gray-900 uppercase mb-4 tracking-wide">5. Normas de Convivencia y Daños</h2>
						<p>
							El hotel se reserva el <strong>derecho de admisión</strong>. El incumplimiento de las normas básicas de convivencia, el exceso del aforo permitido
							por habitación o el consumo de sustancias ilegales facultará al hotel para la rescisión inmediata del contrato sin derecho a reembolso.
							Cualquier daño material causado en las instalaciones será cargado directamente a la cuenta del cliente o a la tarjeta facilitada como garantía.
						</p>
					</section>

					{/* 6. Responsabilidad */}
					<section>
						<h2 className="text-lg font-bold text-gray-900 uppercase mb-4 tracking-wide">6. Exención de Responsabilidad</h2>
						<p>
							El Responsable no se hace cargo de la pérdida, robo o daño de objetos de valor que no hayan sido depositados en la caja fuerte del hotel o
							custodiados formalmente en recepción bajo inventario firmado. Tampoco se responsabiliza de interrupciones de servicios externos (suministro eléctrico,
							internet o agua) ajenos a la gestión directa del establecimiento.
						</p>
					</section>

					{/* 7. Jurisdicción */}
					<section className="bg-gray-900 text-gray-100 p-8 rounded-xl">
						<h2 className="text-lg font-bold uppercase mb-4 tracking-wide text-white">7. Ley Aplicable y Jurisdicción</h2>
						<p className="text-sm leading-relaxed opacity-90 italic">
							Para la resolución de cualquier controversia judicial derivada de la interpretación o aplicación de estas condiciones, las partes se someten,
							con renuncia expresa a cualquier otro fuero que pudiera corresponderles, a los <strong>Juzgados y Tribunales de la ciudad de [Ciudad del Hotel]</strong>,
							España, salvo que por ley se determine un fuero imperativo distinto.
						</p>
					</section>
				</div>

				{/* Footer Legal */}
				<div className="mt-20 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
					<div className="text-[10px] text-gray-400 uppercase font-black tracking-[0.1em]">
						Hotel Gludio S.A. | Registro Mercantil de [Provincia]
					</div>
					<div className="flex gap-6">
						<button
							onClick={() => window.print()}
							className="text-[10px] font-black text-gray-900 hover:text-[#7a0202] transition-colors border-b-2 border-gray-900 uppercase"
						>
							Imprimir Aviso Legal
						</button>
					</div>
				</div>
			</div>
		</GuestLayout>
	);
}
