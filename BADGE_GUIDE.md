/**
 * GUÍA DE USO DEL COMPONENTE Badge
 * 
 * El componente Badge centraliza todos los estilos de etiquetas/estados en la aplicación.
 * Ofrece consistencia visual y facilita mantenimiento.
 * 
 * IMPORTAR:
 * import Badge from '@/Components/UI/Badge';
 * 
 * USO BÁSICO:
 * <Badge label="Activo" tipo="activo" />
 * 
 * PARÁMETROS:
 * - label (string, required): El texto a mostrar
 * - tipo (string, default: 'default'): El tipo de estado/estilo
 * - className (string, optional): Clases adicionales de Tailwind
 * 
 * TIPOS DISPONIBLES:
 * 
 * ESTADOS POSITIVOS (Verde - Emerald):
 * - confirmado: Para reservas confirmadas
 * - activo: Para elementos activos (cupones, usuarios, etc.)
 * - disponible: Para habitaciones disponibles
 * - aprobado: Para solicitudes aprobadas
 * - pagado: Para pagos realizados
 * - completado: Para tareas completadas
 * 
 * ESTADOS EN PROGRESO (Ámbar/Púrpura):
 * - checked_in: Para huéspedes en la habitación (Etiqueta: En Estancia)
 * - proximo: Para eventos próximos
 * - pendiente: Para tareas pendientes
 * - procesando: Para acciones en proceso
 * 
 * ESTADOS NEGATIVOS (Rojo/Gris):
 * - cancelado: Para reservas/eventos cancelados
 * - inactivo: Para elementos desactivados
 * - expirado: Para cupones, ofertas expiradas
 * - no_presentado: Para huéspedes que no se presentaron
 * - rechazado: Para solicitudes rechazadas
 * 
 * REEMBOLSOS (Naranja/Azul):
 * - reembolso_pendiente: Reembolso esperando procesamiento
 * - reembolso_parcial: Reembolso parcial realizado
 * - reembolso_total: Reembolso total realizado
 * - devuelto: Para fondos devueltos
 * 
 * OTROS:
 * - info: Para información general
 * - porcentaje: Para descuentos porcentuales
 * - monto_fijo: Para descuentos de monto fijo
 * 
 * EJEMPLOS:
 * 
 * // Reserva confirmada
 * <Badge label="Confirmada" tipo="confirmado" />
 * 
 * // Pago pendiente
 * <Badge label="Pendiente" tipo="pendiente" />
 * 
 * // Cupón activo
 * <Badge label="Activo" tipo="activo" />
 * 
 * // Con clases adicionales para tamaño personalizado
 * <Badge 
 *   label="En Proceso" 
 *   tipo="procesando" 
 *   className="text-xs py-2 px-4"
 * />
 * 
 * CARACTERÍSTICAS:
 * ✓ Estilos uniformes en toda la app
 * ✓ Colores profesionales y consistentes
 * ✓ Bordes redondeados (rounded-lg)
 * ✓ Padding/margin estándar
 * ✓ Fuente pequeña y bold (text-xs, font-medium)
 * ✓ Fácil personalización con className
 * 
 * MANTENER:
 * Los tipos están definidos en Badge.jsx
 * Si necesitas un tipo nuevo, agregarlo allí
 * No crear estilos inline en otros componentes
 */
