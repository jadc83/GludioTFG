#!/bin/bash

# Verifica que estés en un directorio Laravel
if [ ! -f "artisan" ]; then
    echo "Error: Ejecuta este script en la raíz del proyecto Laravel."
    exit 1
fi

# Abre terminal 1: php artisan serve
mate-terminal --title="Laravel Serve" -- bash -c "php artisan serve; exec bash" &

# Abre terminal 2: npm run dev
mate-terminal --title="NPM Dev" -- bash -c "npm run dev; exec bash" &

# Abre terminal 3: php artisan reverb:start
mate-terminal --title="Reverb" -- bash -c "php artisan reverb:start; exec bash" &

echo "¡Servidores iniciados en tres terminales! Presiona Ctrl+C en cada una para parar."
