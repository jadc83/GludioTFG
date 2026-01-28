<?php

namespace Database\Factories;

use App\Models\Empleado;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmpleadoFactory extends Factory
{
    protected $model = Empleado::class;

    public function definition(): array
    {
        $user = User::factory()->create();

        return [
            'user_id' => $user->id,
            'numero_empleado' => $this->faker->unique()->bothify('EMP###'),
            'departamento' => $this->faker->randomElement(['Recepción','Mantenimiento','Administración']),
            'puesto' => $this->faker->randomElement(['Recepcionista','Conserje','Gerente']),
        ];
    }
}
