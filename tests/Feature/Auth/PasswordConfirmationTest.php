<?php

use App\Models\User;

test('la_pantalla_confirmar_contrasena_se_puede_renderizar', function () {
    $usuario = User::factory()->create();

    $respuesta = $this->actingAs($usuario)->get('/confirm-password');

    $respuesta->assertStatus(200);
});

test('la_contrasena_puede_ser_confirmada', function () {
    $usuario = User::factory()->create();

    $respuesta = $this->actingAs($usuario)->post('/confirm-password', [
        'password' => 'password',
    ]);

    $respuesta->assertRedirect();
    $respuesta->assertSessionHasNoErrors();
});

test('la_contrasena_no_se_confirma_con_contrasena_invalida', function () {
    $usuario = User::factory()->create();

    $respuesta = $this->actingAs($usuario)->post('/confirm-password', [
        'password' => 'wrong-password',
    ]);

    $respuesta->assertSessionHasErrors();
});
