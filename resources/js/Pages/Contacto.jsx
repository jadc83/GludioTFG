import React from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head } from '@inertiajs/react';
import {
	EnvelopeIcon,
	PhoneIcon,
	MapPinIcon,
	ClockIcon,
	BuildingOfficeIcon
} from '@heroicons/react/24/outline';

export default function Contacto() {
	return (
		<GuestLayout>
			<Head title="Contacto y Atención al Cliente" />

			<div className="max-w-4xl mx-auto px-6 py-16">
				<div className="border-b border-gray-200 pb-8 mb-12">
					<h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">Atención al Cliente</h1>
					<p className="mt-4 text-sm text-gray-500 italic">
						Canales oficiales de comunicación de Hotel Gludio. Para una atención eficiente, por favor contacte con el departamento correspondiente.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-gray-700">
					<div className="space-y-10">
						<section>
							<div className="flex items-center gap-2 mb-4">
								<PhoneIcon className="h-5 w-5 text-[#7a0202]" />
								<h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Líneas Telefónicas</h2>
							</div>
							<div className="space-y-3">
								<p className="text-sm font-medium">
									Recepción (24h): <span className="text-gray-900">+34 910 000 000</span>
								</p>
								<p className="text-sm font-medium">
									Central de Reservas: <span className="text-gray-900">+34 910 000 001</span>
								</p>
								<p className="text-xs text-gray-400 font-semibold uppercase mt-2">
									* Coste de llamada según operador nacional.
								</p>
							</div>
						</section>

						<section>
							<div className="flex items-center gap-2 mb-4">
								<EnvelopeIcon className="h-5 w-5 text-[#7a0202]" />
								<h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Correo Electrónico</h2>
							</div>
							<div className="space-y-4">
								<div>
									<p className="text-xs font-black text-gray-400 uppercase">Información General</p>
									<a href="mailto:info@hotelgludio.example" className="text-sm font-bold text-gray-900 underline decoration-[#7a0202]">
										info@hotelgludio.example
									</a>
								</div>
								<div>
									<p className="text-xs font-black text-gray-400 uppercase">Gestión de Reservas</p>
									<a href="mailto:reservas@hotelgludio.example" className="text-sm font-bold text-gray-900 underline decoration-[#7a0202]">
										reservas@hotelgludio.example
									</a>
								</div>
							</div>
						</section>
					</div>

					<div className="space-y-10">
						<section>
							<div className="flex items-center gap-2 mb-4">
								<MapPinIcon className="h-5 w-5 text-[#7a0202]" />
								<h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Ubicación Física</h2>
							</div>
							<p className="text-sm leading-relaxed">
								<strong>Hotel Gludio S.A.</strong><br />
								Calle de la Hospitalidad, 123<br />
								28001 Madrid, España
							</p>
						</section>

						<section>
							<div className="flex items-center gap-2 mb-4">
								<BuildingOfficeIcon className="h-5 w-5 text-[#7a0202]" />
								<h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Otros Departamentos</h2>
							</div>
							<ul className="space-y-2 text-sm italic border-l-2 border-gray-100 pl-4">
								<li>• Eventos y Grupos: <span className="font-semibold">events@hotelgludio.example</span></li>
								<li>• Recursos Humanos: <span className="font-semibold">rrhh@hotelgludio.example</span></li>
								<li>• Proveedores: <span className="font-semibold">compras@hotelgludio.example</span></li>
							</ul>
						</section>

						<section className="bg-gray-50 p-6 rounded-xl border border-gray-100">
							<div className="flex items-center gap-2 mb-2">
								<ClockIcon className="h-4 w-4 text-gray-400" />
								<h3 className="text-xs font-black uppercase text-gray-900 tracking-tighter">Horario Administrativo</h3>
							</div>
							<p className="text-xs text-gray-500 font-medium leading-relaxed">
								Lunes a Viernes: 09:00 - 19:00<br />
								Sábados: 10:00 - 14:00<br />
								Recepción: Operativa 24 horas/365 días.
							</p>
						</section>
					</div>
				</div>

				{/* Pie de Página de Contacto */}
				<div className="mt-20 pt-8 border-t border-gray-100 text-center">
					<p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">
						Hotel Gludio | Establecimiento Turístico Oficial
					</p>
				</div>
			</div>
		</GuestLayout>
	);
}
