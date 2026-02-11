<?php

use App\Models\User;

test('la_pantalla_login_se_puede_renderizar', function () {
    $respuesta = $this->get('/login');

    $respuesta->assertStatus(200);
});

test('los_usuarios_pueden_autenticarse_desde_la_pantalla_login', function () {
    $usuario = User::factory()->create();

    $respuesta = $this->post('/login', [
        'email' => $usuario->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $respuesta->assertRedirect(route('dashboard', absolute: false));
});

test('los_usuarios_no_pueden_autenticarse_con_contrasena_invalida', function () {
    $usuario = User::factory()->create();

    $this->post('/login', [
        'email' => $usuario->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('los_usuarios_pueden_cerrar_sesion', function () {
    $usuario = User::factory()->create();

    $respuesta = $this->actingAs($usuario)->post('/logout');

    $this->assertGuest();
    $respuesta->assertRedirect('/');
});
