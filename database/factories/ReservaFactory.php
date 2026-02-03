<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Reserva>
 */
class ReservaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $checkIn = now()->addDays(1)->startOfDay();
        $checkOut = now()->addDays(3)->startOfDay();

        $cliente = \App\Models\Cliente::factory()->create();

        return [
            'localizador' => strtoupper(fake()->bothify('????##')),
            'user_id' => null,
            'booked_by_user_id' => null,
            'check_in' => $checkIn->toDateString(),
            'check_out' => $checkOut->toDateString(),
            'precio_total' => fake()->randomFloat(2, 50, 500),
            'status' => 'pending',
            'pago' => 'pending',
            'notas' => null,
            'reservable_type' => \App\Models\Cliente::class,
            'reservable_id' => $cliente->id,
            'tarifa_id' => null,
            'cupon_id' => null,
            'descuento_aplicado' => 0.0,
        ];
    }
}
