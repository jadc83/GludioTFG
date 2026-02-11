<?php

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;

test('la_pantalla_verificacion_email_se_puede_renderizar', function () {
    $usuario = User::factory()->unverified()->create();

    $respuesta = $this->actingAs($usuario)->get('/verify-email');

    $respuesta->assertStatus(200);
});

test('el_email_puede_ser_verificado', function () {
    $usuario = User::factory()->unverified()->create();

    Event::fake();

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $usuario->id, 'hash' => sha1($usuario->email)]
    );

    $respuesta = $this->actingAs($usuario)->get($verificationUrl);

    Event::assertDispatched(Verified::class);
    expect($usuario->fresh()->hasVerifiedEmail())->toBeTrue();
    $respuesta->assertRedirect(route('dashboard', absolute: false).'?verified=1');
});

test('el_email_no_se_verifica_con_hash_invalido', function () {
    $usuario = User::factory()->unverified()->create();

    $verificationUrl = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $usuario->id, 'hash' => sha1('wrong-email')]
    );

    $this->actingAs($usuario)->get($verificationUrl);

    expect($usuario->fresh()->hasVerifiedEmail())->toBeFalse();
});
