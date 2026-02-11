import React from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head } from '@inertiajs/react';

export default function PoliticaPrivacidad() {
	return (
		<GuestLayout>
			<Head title="Política de Privacidad - Aviso Legal" />

			<div className="max-w-4xl mx-auto px-6 py-16">
				{/* Encabezado Legal */}
				<div className="border-b border-gray-200 pb-8 mb-12">
					<h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tight">Política de Privacidad</h1>
					<p className="mt-4 text-sm text-gray-500">
						Este documento establece los términos en que Hotel Gludio trata y protege la información personal.
						Al utilizar nuestros servicios, usted acepta las prácticas descritas en este aviso.
					</p>
				</div>

				<div className="space-y-12 text-gray-700 leading-relaxed">

					{/* 1. Responsable del Tratamiento */}
					<section>
						<h2 className="text-lg font-bold text-gray-900 uppercase mb-4 tracking-wide">1. Responsable del Tratamiento</h2>
						<p>
							El responsable del tratamiento de los datos recabados es <strong>Hotel Gludio</strong> (en adelante, "el Responsable"),
							con domicilio legal en [Dirección Completa]. Puede contactar con nuestro Delegado de Protección de Datos a través del correo electrónico:
							<span className="font-semibold text-gray-900 ml-1">privacy@hotelgludio.example</span>.
						</p>
					</section>

					{/* 2. Base Legal y Marco Normativo */}
					<section>
						<h2 className="text-lg font-bold text-gray-900 uppercase mb-4 tracking-wide">2. Base Legal</h2>
						<p>
							El tratamiento de sus datos se realiza conforme al <strong>Reglamento (UE) 2016/679 (RGPD)</strong> y la normativa local vigente en materia de
							protección de datos de carácter personal. La base legal para el tratamiento es el cumplimiento de la relación contractual (reserva),
							el interés legítimo del hotel y el cumplimiento de obligaciones legales de registro de viajeros.
						</p>
					</section>

					{/* 3. Datos Objeto de Tratamiento */}
					<section>
						<h2 className="text-lg font-bold text-gray-900 uppercase mb-4 tracking-wide">3. Categoría de Datos Recabados</h2>
						<p className="mb-4">Tratamos los datos estrictamente necesarios para la prestación del servicio:</p>
						<ul className="list-disc pl-6 space-y-2 italic">
							<li><strong>Datos Identificativos:</strong> Nombre, apellidos, número de DNI, NIE o pasaporte.</li>
							<li><strong>Datos de Contacto:</strong> Dirección postal, correo electrónico y número de teléfono.</li>
							<li><strong>Datos Económicos:</strong> Información de tarjetas de crédito/débito y detalles de facturación.</li>
							<li><strong>Datos de Estancia:</strong> Fechas de alojamiento y preferencias de servicio declaradas por el usuario.</li>
						</ul>
					</section>

					{/* 4. Finalidad del Tratamiento */}
					<section>
						<h2 className="text-lg font-bold text-gray-900 uppercase mb-4 tracking-wide">4. Finalidad</h2>
						<p>Los datos personales de los usuarios serán tratados con las siguientes finalidades:</p>
						<ol className="list-decimal pl-6 mt-4 space-y-3">
							<li>Gestionar y confirmar las reservas de alojamiento.</li>
							<li>Dar cumplimiento al registro legal de viajeros exigido por las autoridades de seguridad pública.</li>
							<li>Gestión administrativa, contable y fiscal derivada del servicio prestado.</li>
							<li>Envío de comunicaciones comerciales técnicas o de confirmación relacionadas con su reserva.</li>
						</ol>
					</section>

					{/* 5. Conservación de Datos */}
					<section>
						<h2 className="text-lg font-bold text-gray-900 uppercase mb-4 tracking-wide">5. Plazos de Conservación</h2>
						<p>
							Los datos personales se conservarán durante el tiempo estrictamente necesario para la finalidad del tratamiento y, una vez finalizado,
							se mantendrán debidamente bloqueados durante los plazos de prescripción legal de responsabilidades contractuales y fiscales (generalmente entre 5 y 10 años).
						</p>
					</section>

					{/* 6. Cesión a Terceros */}
					<section>
						<h2 className="text-lg font-bold text-gray-900 uppercase mb-4 tracking-wide">6. Comunicación de Datos</h2>
						<p>
							No se cederán datos a terceros salvo obligación legal (Autoridades de Seguridad, Administración Tributaria) o cuando sea estrictamente
							necesario para la ejecución del pago (entidades bancarias y pasarelas de pago certificadas). No se realizan transferencias internacionales de datos.
						</p>
					</section>

					{/* 7. Derechos del Interesado */}
					<section className="bg-gray-50 p-8 rounded-xl border border-gray-100">
						<h2 className="text-lg font-bold text-gray-900 uppercase mb-4 tracking-wide">7. Derechos de los Usuarios (ARCO-POL)</h2>
						<p className="mb-4">Usted puede ejercer en cualquier momento sus derechos de:</p>
						<div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm font-medium mb-6">
							<div>• Acceso</div>
							<div>• Rectificación</div>
							<div>• Supresión (Olvido)</div>
							<div>• Oposición</div>
							<div>• Limitación del tratamiento</div>
							<div>• Portabilidad</div>
						</div>
						<p className="text-sm">
							Para ejercer estos derechos, debe remitir una comunicación escrita acompañada de una copia de su documento de identidad a
							<span className="font-bold underline ml-1">privacy@hotelgludio.example</span>.
						</p>
					</section>

					{/* 8. Seguridad */}
					<section>
						<h2 className="text-lg font-bold text-gray-900 uppercase mb-4 tracking-wide">8. Medidas de Seguridad</h2>
						<p>
							Hotel Gludio garantiza la adopción de medidas técnicas y organizativas necesarias para asegurar la integridad y seguridad de los datos
							personales, evitando su alteración, pérdida o acceso no autorizado, de acuerdo con el estado de la tecnología y la naturaleza de los datos almacenados.
						</p>
					</section>
				</div>

				{/* Footer de la página legal */}
				<div className="mt-20 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
					<div className="text-xs text-gray-400 uppercase font-semibold">
						Vigencia: Febrero 2026 | Hotel Gludio S.A.
					</div>
					<div className="flex gap-6">
						<button
							onClick={() => window.print()}
							className="text-xs font-bold text-gray-900 hover:text-[#7a0202] transition-colors border-b border-gray-900"
						>
							IMPRIMIR DOCUMENTO
						</button>
					</div>
				</div>
			</div>
		</GuestLayout>
	);
}
