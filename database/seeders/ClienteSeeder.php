<?php

namespace Database\Seeders;

use App\Models\Cliente;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ClienteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $clientes = [
            ['name' => 'Juan García López', 'email' => 'juan.garcia@example.com', 'telefono' => '34912345678', 'tipo_documento' => 'dni', 'numero_documento' => '12345678A', 'nacionalidad' => 'Española', 'direccion' => 'Calle Principal 1, Madrid'],
            ['name' => 'María Rodríguez Martín', 'email' => 'maria.rodriguez@example.com', 'telefono' => '34987654321', 'tipo_documento' => 'dni', 'numero_documento' => '87654321B', 'nacionalidad' => 'Española', 'direccion' => 'Avenida Central 25, Barcelona'],
            ['name' => 'Carlos López Fernández', 'email' => 'carlos.lopez@example.com', 'telefono' => '34912345679', 'tipo_documento' => 'dni', 'numero_documento' => '12345679C', 'nacionalidad' => 'Española', 'direccion' => 'Calle Secundaria 12, Valencia'],
            ['name' => 'Ana Martínez González', 'email' => 'ana.martinez@example.com', 'telefono' => '34987654322', 'tipo_documento' => 'dni', 'numero_documento' => '87654322D', 'nacionalidad' => 'Española', 'direccion' => 'Plaza Mayor 5, Sevilla'],
            ['name' => 'Pedro Sánchez Pérez', 'email' => 'pedro.sanchez@example.com', 'telefono' => '34912345680', 'tipo_documento' => 'dni', 'numero_documento' => '12345680E', 'nacionalidad' => 'Española', 'direccion' => 'Calle Menor 8, Bilbao'],
            ['name' => 'Isabel Hernández García', 'email' => 'isabel.hernandez@example.com', 'telefono' => '34987654323', 'tipo_documento' => 'pasaporte', 'numero_documento' => 'A1234567', 'nacionalidad' => 'Portuguesa', 'direccion' => 'Rua das Flores 10, Lisboa'],
            ['name' => 'Francisco Torres López', 'email' => 'francisco.torres@example.com', 'telefono' => '34912345681', 'tipo_documento' => 'dni', 'numero_documento' => '12345681F', 'nacionalidad' => 'Española', 'direccion' => 'Paseo del Prado 15, Madrid'],
            ['name' => 'Rosa Díaz Cabrera', 'email' => 'rosa.diaz@example.com', 'telefono' => '34987654324', 'tipo_documento' => 'dni', 'numero_documento' => '87654324G', 'nacionalidad' => 'Española', 'direccion' => 'Calle Larga 20, Málaga'],
            ['name' => 'Luis Moreno Jiménez', 'email' => 'luis.moreno@example.com', 'telefono' => '34912345682', 'tipo_documento' => 'tie', 'numero_documento' => 'B2345678', 'nacionalidad' => 'Italiana', 'direccion' => 'Via Roma 30, Roma'],
            ['name' => 'Juana López Ruiz', 'email' => 'juana.lopez@example.com', 'telefono' => '34987654325', 'tipo_documento' => 'dni', 'numero_documento' => '87654325H', 'nacionalidad' => 'Española', 'direccion' => 'Avenida del Mar 18, Alicante'],
            ['name' => 'Diego Fernández Gutiérrez', 'email' => 'diego.fernandez@example.com', 'telefono' => '34912345683', 'tipo_documento' => 'dni', 'numero_documento' => '12345683I', 'nacionalidad' => 'Española', 'direccion' => 'Calle Nueva 7, Córdoba'],
            ['name' => 'Elena García Navarro', 'email' => 'elena.garcia@example.com', 'telefono' => '34987654326', 'tipo_documento' => 'pasaporte', 'numero_documento' => 'C3456789', 'nacionalidad' => 'Francesa', 'direccion' => 'Rue de la Paix 42, París'],
            ['name' => 'Raúl Martínez Vega', 'email' => 'raul.martinez@example.com', 'telefono' => '34912345684', 'tipo_documento' => 'dni', 'numero_documento' => '12345684J', 'nacionalidad' => 'Española', 'direccion' => 'Paseo de Gracia 50, Barcelona'],
            ['name' => 'Teresa López Iglesias', 'email' => 'teresa.lopez@example.com', 'telefono' => '34987654327', 'tipo_documento' => 'dni', 'numero_documento' => '87654327K', 'nacionalidad' => 'Española', 'direccion' => 'Calle Oscura 3, Murcia'],
            ['name' => 'Víctor Rodríguez Iglesias', 'email' => 'victor.rodriguez@example.com', 'telefono' => '34912345685', 'tipo_documento' => 'tie', 'numero_documento' => 'D4567890', 'nacionalidad' => 'Alemán', 'direccion' => 'Berliner Strasse 24, Berlín'],
            ['name' => 'Sofía Pérez García', 'email' => 'sofia.perez@example.com', 'telefono' => '34987654328', 'tipo_documento' => 'dni', 'numero_documento' => '87654328L', 'nacionalidad' => 'Española', 'direccion' => 'Gran Vía 88, Madrid'],
            ['name' => 'Andrés González López', 'email' => 'andres.gonzalez@example.com', 'telefono' => '34912345686', 'tipo_documento' => 'dni', 'numero_documento' => '12345686M', 'nacionalidad' => 'Española', 'direccion' => 'Calle Ancha 11, Zaragoza'],
            ['name' => 'Beatriz Sánchez Moreno', 'email' => 'beatriz.sanchez@example.com', 'telefono' => '34987654329', 'tipo_documento' => 'pasaporte', 'numero_documento' => 'E5678901', 'nacionalidad' => 'Británica', 'direccion' => 'Oxford Street 100, Londres'],
            ['name' => 'Manuel Ruiz Fernández', 'email' => 'manuel.ruiz@example.com', 'telefono' => '34912345687', 'tipo_documento' => 'dni', 'numero_documento' => '12345687N', 'nacionalidad' => 'Española', 'direccion' => 'Calle Estrecha 6, Jaén'],
            ['name' => 'Cristina Díaz González', 'email' => 'cristina.diaz@example.com', 'telefono' => '34987654330', 'tipo_documento' => 'dni', 'numero_documento' => '87654330O', 'nacionalidad' => 'Española', 'direccion' => 'Avenida Peatonal 35, Granada'],
            ['name' => 'José Antonio Jiménez García', 'email' => 'jose.jimenez@example.com', 'telefono' => '34912345688', 'tipo_documento' => 'dni', 'numero_documento' => '12345688P', 'nacionalidad' => 'Española', 'direccion' => 'Carrera Ancha 22, Toledo'],
            ['name' => 'Montserrat Cabrera López', 'email' => 'montserrat.cabrera@example.com', 'telefono' => '34987654331', 'tipo_documento' => 'tie', 'numero_documento' => 'F6789012', 'nacionalidad' => 'Holandesa', 'direccion' => 'Kalverstraat 50, Ámsterdam'],
            ['name' => 'Ángel Navarro García', 'email' => 'angel.navarro@example.com', 'telefono' => '34912345689', 'tipo_documento' => 'dni', 'numero_documento' => '12345689Q', 'nacionalidad' => 'Española', 'direccion' => 'Vía Augusta 60, Barcelona'],
            ['name' => 'Lucía Gómez Rodríguez', 'email' => 'lucia.gomez@example.com', 'telefono' => '34987654332', 'tipo_documento' => 'dni', 'numero_documento' => '87654332R', 'nacionalidad' => 'Española', 'direccion' => 'Calle Real 14, Almería'],
            ['name' => 'Roberto Fernández Díaz', 'email' => 'roberto.fernandez@example.com', 'telefono' => '34912345690', 'tipo_documento' => 'pasaporte', 'numero_documento' => 'G7890123', 'nacionalidad' => 'Belga', 'direccion' => 'Grand Place 1, Bruselas'],
            ['name' => 'Margarita López Ramos', 'email' => 'margarita.lopez@example.com', 'telefono' => '34987654333', 'tipo_documento' => 'dni', 'numero_documento' => '87654333S', 'nacionalidad' => 'Española', 'direccion' => 'Pasaje Estrecho 9, Cádiz'],
            ['name' => 'Gustavo Ramírez Pérez', 'email' => 'gustavo.ramirez@example.com', 'telefono' => '34912345691', 'tipo_documento' => 'dni', 'numero_documento' => '12345691T', 'nacionalidad' => 'Española', 'direccion' => 'Calle Blanca 21, Valladolid'],
            ['name' => 'Dolores García Jiménez', 'email' => 'dolores.garcia@example.com', 'telefono' => '34987654334', 'tipo_documento' => 'tie', 'numero_documento' => 'H8901234', 'nacionalidad' => 'Suiza', 'direccion' => 'Bahnhofstrasse 55, Zúrich'],
            ['name' => 'Enrique López Vargas', 'email' => 'enrique.lopez@example.com', 'telefono' => '34912345692', 'tipo_documento' => 'dni', 'numero_documento' => '12345692U', 'nacionalidad' => 'Española', 'direccion' => 'Calle del Comercio 45, Palma'],
            ['name' => 'Herminia Ruiz Conrado', 'email' => 'herminia.ruiz@example.com', 'telefono' => '34987654335', 'tipo_documento' => 'dni', 'numero_documento' => '87654335V', 'nacionalidad' => 'Española', 'direccion' => 'Avenida Libertad 16, Las Palmas'],
            ['name' => 'Gabriel Sáenz Fernández', 'email' => 'gabriel.saenz@example.com', 'telefono' => '34912345693', 'tipo_documento' => 'pasaporte', 'numero_documento' => 'I9012345', 'nacionalidad' => 'Austriaca', 'direccion' => 'Stephansplatz 3, Viena'],
            ['name' => 'Jacinta Morales García', 'email' => 'jacinta.morales@example.com', 'telefono' => '34987654336', 'tipo_documento' => 'dni', 'numero_documento' => '87654336W', 'nacionalidad' => 'Española', 'direccion' => 'Ronda de Santiago 38, Ibiza'],
            ['name' => 'Hipólito García Ruiz', 'email' => 'hipolito.garcia@example.com', 'telefono' => '34912345694', 'tipo_documento' => 'dni', 'numero_documento' => '12345694X', 'nacionalidad' => 'Española', 'direccion' => 'Calle Virgen 4, Huelva'],
            ['name' => 'Inés López Cano', 'email' => 'ines.lopez@example.com', 'telefono' => '34987654337', 'tipo_documento' => 'tie', 'numero_documento' => 'J0123456', 'nacionalidad' => 'Griega', 'direccion' => 'Syntagma Square 12, Atenas'],
            ['name' => 'Joaquín Peña Rodríguez', 'email' => 'joaquin.pena@example.com', 'telefono' => '34912345695', 'tipo_documento' => 'dni', 'numero_documento' => '12345695Y', 'nacionalidad' => 'Española', 'direccion' => 'Calle San Jorge 28, Alcalá'],
            ['name' => 'Karina Castillo Hernández', 'email' => 'karina.castillo@example.com', 'telefono' => '34987654338', 'tipo_documento' => 'dni', 'numero_documento' => '87654338Z', 'nacionalidad' => 'Española', 'direccion' => 'Paseo de los Álamos 19, Móstoles'],
            ['name' => 'Laureano García Expósito', 'email' => 'laureano.garcia@example.com', 'telefono' => '34912345696', 'tipo_documento' => 'pasaporte', 'numero_documento' => 'K1234567', 'nacionalidad' => 'Sueca', 'direccion' => 'Drottninggatan 20, Estocolmo'],
            ['name' => 'Lorena López Caballero', 'email' => 'lorena.lopez@example.com', 'telefono' => '34987654339', 'tipo_documento' => 'dni', 'numero_documento' => '87654339AA', 'nacionalidad' => 'Española', 'direccion' => 'Avenida Principal 101, Fuenlabrada'],
            ['name' => 'Mateo Jiménez Ramos', 'email' => 'mateo.jimenez@example.com', 'telefono' => '34912345697', 'tipo_documento' => 'dni', 'numero_documento' => '12345697BB', 'nacionalidad' => 'Española', 'direccion' => 'Calle Baja 13, Alcorcón'],
            ['name' => 'Nuria García Domínguez', 'email' => 'nuria.garcia@example.com', 'telefono' => '34987654340', 'tipo_documento' => 'tie', 'numero_documento' => 'L2345678', 'nacionalidad' => 'Danesa', 'direccion' => 'Strøget 30, Copenhague'],
            ['name' => 'Óscar López Dueñas', 'email' => 'oscar.lopez@example.com', 'telefono' => '34912345698', 'tipo_documento' => 'dni', 'numero_documento' => '12345698CC', 'nacionalidad' => 'Española', 'direccion' => 'Calle Alta 51, Getafe'],
            ['name' => 'Patricia Rodríguez Serrano', 'email' => 'patricia.rodriguez@example.com', 'telefono' => '34987654341', 'tipo_documento' => 'dni', 'numero_documento' => '87654341DD', 'nacionalidad' => 'Española', 'direccion' => 'Avenida España 71, Leganés'],
            ['name' => 'Quique Martínez López', 'email' => 'quique.martinez@example.com', 'telefono' => '34912345699', 'tipo_documento' => 'pasaporte', 'numero_documento' => 'M3456789', 'nacionalidad' => 'Noruega', 'direccion' => 'Karl Johans gate 15, Oslo'],
            ['name' => 'Ramona López García', 'email' => 'ramona.lopez@example.com', 'telefono' => '34987654342', 'tipo_documento' => 'dni', 'numero_documento' => '87654342EE', 'nacionalidad' => 'Española', 'direccion' => 'Calle Mayor 26, Rivas'],
            ['name' => 'Samuel García Rodríguez', 'email' => 'samuel.garcia@example.com', 'telefono' => '34912345700', 'tipo_documento' => 'dni', 'numero_documento' => '12345700FF', 'nacionalidad' => 'Española', 'direccion' => 'Pasaje del Comercio 8, Torrejón'],
            ['name' => 'Susana López Fernández', 'email' => 'susana.lopez@example.com', 'telefono' => '34987654343', 'tipo_documento' => 'tie', 'numero_documento' => 'N4567890', 'nacionalidad' => 'Polaca', 'direccion' => 'Rynek Starego Miasta 10, Varsovia'],
            ['name' => 'Teodoro García Campos', 'email' => 'teodoro.garcia@example.com', 'telefono' => '34912345701', 'tipo_documento' => 'dni', 'numero_documento' => '12345701GG', 'nacionalidad' => 'Española', 'direccion' => 'Calle Pinar 37, San Sebastián'],
            ['name' => 'Úrsula López Gutiérrez', 'email' => 'ursula.lopez@example.com', 'telefono' => '34987654344', 'tipo_documento' => 'dni', 'numero_documento' => '87654344HH', 'nacionalidad' => 'Española', 'direccion' => 'Avenida del Cantábrico 55, Oviedo'],
            ['name' => 'Vicente García López', 'email' => 'vicente.garcia@example.com', 'telefono' => '34912345702', 'tipo_documento' => 'pasaporte', 'numero_documento' => 'O5678901', 'nacionalidad' => 'Checa', 'direccion' => 'Václavské náměstí 25, Praga'],
            ['name' => 'Wanda López Martínez', 'email' => 'wanda.lopez@example.com', 'telefono' => '34987654345', 'tipo_documento' => 'dni', 'numero_documento' => '87654345II', 'nacionalidad' => 'Española', 'direccion' => 'Calle Verde 42, Vigo'],
            ['name' => 'Xenia García Navarro', 'email' => 'xenia.garcia@example.com', 'telefono' => '34912345703', 'tipo_documento' => 'dni', 'numero_documento' => '12345703JJ', 'nacionalidad' => 'Española', 'direccion' => 'Ronda de la Paz 19, Elche'],
            ['name' => 'Yolanda López Díaz', 'email' => 'yolanda.lopez@example.com', 'telefono' => '34987654346', 'tipo_documento' => 'tie', 'numero_documento' => 'P6789012', 'nacionalidad' => 'Húngara', 'direccion' => 'Andrássy út 1, Budapest'],
            ['name' => 'Zacarías García Romero', 'email' => 'zacarias.garcia@example.com', 'telefono' => '34912345704', 'tipo_documento' => 'dni', 'numero_documento' => '12345704KK', 'nacionalidad' => 'Española', 'direccion' => 'Calle Central 66, Oviedo'],
        ];

        foreach ($clientes as $cliente) {
            Cliente::create($cliente);
        }
    }
}
