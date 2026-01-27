import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

export default function QRScanner({ onScanSuccess }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const animationIdRef = useRef(null);

    useEffect(() => {
        const initCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                    scan();
                }
            } catch (err) {
                setPermissionDenied(true);
            }
        };

        const scan = () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
                    // Obtener o crear contexto optimizado para lecturas frecuentes
                let ctx = canvas._ctx;
                if (!ctx) {
                    try {
                        ctx = canvas.getContext('2d', { willReadFrequently: true });
                    } catch (e) {
                        // Fallback en navegadores que no soporten la opción
                        ctx = canvas.getContext('2d');
                    }
                    canvas._ctx = ctx;
                }

                // Actualizar tamaño solo cuando cambie (evitar reflows innecesarios)
                if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                }

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                let imageData;
                try {
                    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                } catch (err) {
                    // Si por alguna razón getImageData falla en tamaño completo, intentar una región menor para evitar romper el bucle
                    try {
                        const w = Math.min(canvas.width, 320);
                        const h = Math.min(canvas.height, 240);
                        imageData = ctx.getImageData(0, 0, w, h);
                    } catch (e) {
                        imageData = null;
                    }
                }

                if (imageData) {
                    try {
                        const code = jsQR(imageData.data, imageData.width, imageData.height);
                        if (code && code.data && String(code.data).trim().length > 0) {
                            onScanSuccess(code.data);
                            return;
                        }
                    } catch (err) {
                        // Ignorar errores de parsing y continuar
                    }
                }
            }

            animationIdRef.current = requestAnimationFrame(scan);
        };

        initCamera();

        return () => {
            if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, [onScanSuccess]);

    return (
        <div className="w-full">
            {permissionDenied && (
                <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">Permiso de cámara denegado.</div>
            )}
            <video ref={videoRef} className="w-full rounded-lg border-2 border-gray-300 bg-black" style={{ minHeight: '400px' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
}
