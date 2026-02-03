<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Cliente>
 */
class ClienteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'telefono' => fake()->numerify('6########'),
            'tipo_documento' => fake()->randomElement(['dni', 'pasaporte', 'tie']),
            'numero_documento' => fake()->bothify('########?'),
            'nacionalidad' => fake()->country(),
            'direccion' => fake()->address(),
        ];
    }
}
