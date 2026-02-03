<?php

test('registration screen can be rendered', function () {
    $response = $this->get('/register');

    $response->assertStatus(200);
});

test('new users can register', function () {
    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'tipo_documento' => 'dni',
        'numero_documento' => '12345678A',
        'nacionalidad' => 'España',
        'direccion' => 'Calle Falsa 123',
        'telefono' => '600000000'
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});
