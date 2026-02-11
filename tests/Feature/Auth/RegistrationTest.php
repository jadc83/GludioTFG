<?php

test('la_pantalla_de_registro_se_puede_renderizar', function () {
    $respuesta = $this->get('/register');

    $respuesta->assertStatus(200);
});

test('nuevos_usuarios_pueden_registrarse', function () {
    $respuesta = $this->post('/register', [
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
    $respuesta->assertRedirect(route('dashboard', absolute: false));
});
