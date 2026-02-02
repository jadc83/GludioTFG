import React, { useMemo } from 'react';

/**
 * Hook personalizado para generar componentes del día del calendario
 * Maneja la lógica de renderización de precios y barras de ocupación
 * Usado por: BarraReservas para personalizar el calendario
 * Parámetros: mapaPrecios (objeto con precios por fecha), formatearISO (función de formateo)
 * Retorna: objeto con componentes del día para react-day-picker
 */
export default function useCalendarioDia(mapaPrecios, formatearISO) {
    const componentesDia = useMemo(
        () => ({
            Day: ({ date, disabled, ...props }) => {
                const iso =
                    props?.day?.isoDate || (date ? formatearISO(date) : null);
                const info = iso ? mapaPrecios[iso] : undefined;
                const precio = info?.precio;
                const ocupacion = info?.ocupacion ?? 0;

                // Determinar si la fecha es anterior a hoy
                let ayer = false;
                try {
                    if (date instanceof Date && !Number.isNaN(date.getTime())) {
                        const diaDate = new Date(
                            date.getFullYear(),
                            date.getMonth(),
                            date.getDate(),
                        );
                        const hoy = new Date();
                        const t = new Date(
                            hoy.getFullYear(),
                            hoy.getMonth(),
                            hoy.getDate(),
                        );
                        ayer = diaDate < t;
                    }
                } catch (e) {
                    ayer = false;
                }

                // Generar elementos adicionales (precio y barra de ocupación)
                const elementosAdicionales = [];

                // Mostrar precio si no es día pasado, no está deshabilitado, hay precio y no está al 100%
                if (!ayer && !disabled && precio && ocupacion !== 100) {
                    elementosAdicionales.push(
                        <span
                            key="precio"
                            className="rdp-day_price"
                            style={{
                                position: 'absolute',
                                top: '6%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                zIndex: 50,
                                fontSize: '10px',
                                fontWeight: 'bold',
                                color: '#7a0202',
                            }}
                        >
                            €{precio}
                        </span>,
                    );
                }

                // Mostrar barra de ocupación si no es día pasado, no está deshabilitado, hay ocupación y no está al 100%
                if (!ayer && !disabled && ocupacion > 0 && ocupacion !== 100) {
                    elementosAdicionales.push(
                        <div
                            key="ocupacion"
                            className="rdp-day_occupancy_bar"
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                height: '6px',
                                backgroundColor:
                                    ocupacion > 80
                                        ? '#7a0202'
                                        : ocupacion > 50
                                          ? '#6b7280'
                                          : '#d1d5db',
                                width: `${ocupacion}%`,
                                borderRadius: '0 0 8px 8px',
                                zIndex: 5,
                            }}
                        />,
                    );
                }

                // Clonar el contenido original y añadir elementos adicionales
                let contenido = props.children;
                if (
                    React.isValidElement(contenido) &&
                    elementosAdicionales.length > 0
                ) {
                    const hijosOriginales = contenido.props.children;
                    contenido = React.cloneElement(contenido, {}, [
                        hijosOriginales,
                        ...elementosAdicionales,
                    ]);
                }

                return <td className={props.className}>{contenido}</td>;
            },
        }),
        [mapaPrecios, formatearISO],
    );

    return componentesDia;
}
