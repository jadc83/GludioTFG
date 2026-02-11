<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('se_puede_actualizar_la_contrasena', function () {
    $usuario = User::factory()->create();

    $respuesta = $this
        ->actingAs($usuario)
        ->from('/profile')
        ->put('/password', [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $respuesta
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $this->assertTrue(Hash::check('new-password', $usuario->refresh()->password));
});

test('se_debe_proporcionar_la_contrasena_correcta_para_actualizar', function () {
    $usuario = User::factory()->create();

    $respuesta = $this
        ->actingAs($usuario)
        ->from('/profile')
        ->put('/password', [
            'current_password' => 'wrong-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $respuesta
        ->assertSessionHasErrors('current_password')
        ->assertRedirect('/profile');
});
