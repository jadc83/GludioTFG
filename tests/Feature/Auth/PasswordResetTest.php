<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Notification;

test('la_pantalla_de_enlace_restablecer_contrasena_se_puede_renderizar', function () {
    $respuesta = $this->get('/forgot-password');

    $respuesta->assertStatus(200);
});

test('se_puede_solicitar_enlace_restablecer_contrasena', function () {
    Notification::fake();

    $usuario = User::factory()->create();

    $this->post('/forgot-password', ['email' => $usuario->email]);

    Notification::assertSentTo($usuario, ResetPassword::class);
});

test('la_pantalla_restablecer_contrasena_se_puede_renderizar', function () {
    Notification::fake();

    $usuario = User::factory()->create();

    $this->post('/forgot-password', ['email' => $usuario->email]);

    Notification::assertSentTo($usuario, ResetPassword::class, function ($notification) {
        $respuesta = $this->get('/reset-password/'.$notification->token);

        $respuesta->assertStatus(200);

        return true;
    });
});

test('se_puede_reiniciar_la_contrasena_con_token_valido', function () {
    Notification::fake();

    $usuario = User::factory()->create();

    $this->post('/forgot-password', ['email' => $usuario->email]);

    Notification::assertSentTo($usuario, ResetPassword::class, function ($notification) use ($usuario) {
        $respuesta = $this->post('/reset-password', [
            'token' => $notification->token,
            'email' => $usuario->email,
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $respuesta
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('login'));

        return true;
    });
});
