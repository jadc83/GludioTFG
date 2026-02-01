<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(\Database\Seeders\AdminUserSeeder::class);
        $this->call(\Database\Seeders\TiposHabitacionSeeder::class);
        $this->call(\Database\Seeders\TarifasSeeder::class);
        $this->call(\Database\Seeders\HabitacionSeeder::class);
        $this->call(\Database\Seeders\ClienteSeeder::class);
        $this->call(\Database\Seeders\CuponSeeder::class);
    }
}
