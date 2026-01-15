<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Autorizar suscripción a canales privados de reservas
Broadcast::channel('reservas.{id}', function ($user, $id) {
    // Ejemplo: permitir si el usuario tiene permiso para ver la reserva
    // Ajusta la lógica según tus políticas (por ejemplo usar policies)
    return $user !== null; // permitir usuarios autenticados
});

// Autorizar suscripción al canal privado 'reservas' (global)
Broadcast::channel('reservas', function ($user) {
    return $user !== null; // permitir usuarios autenticados
});

// Puedes añadir reglas más estrictas, p.e. usando una policy:
// Broadcast::channel('reservas.{id}', function ($user, $id) {
//     return $user->can('view', App\Models\Reserva::find($id));
// });
