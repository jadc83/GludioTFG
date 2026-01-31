<?php
// Script de prueba independiente que no usa base de datos.
// Reproduce el caso: única habitación 'familiar' con placeholder/reserva
// entre 2026-01-31 y 2026-02-02. Solicitamos disponibilidad 2026-01-31..2026-02-03

function parseDate(string $d): DateTime {
    return new DateTime($d);
}

function overlaps(DateTime $aStart, DateTime $aEnd, DateTime $bStart, DateTime $bEnd): bool {
    return ($aStart < $bEnd) && ($aEnd > $bStart);
}

$rooms = [
    ['id' => 1, 'tipo' => 'familiar', 'numero' => 'F-1'],
    // añadir otras habitaciones de distintos tipos si quieres
    ['id' => 2, 'tipo' => 'suite', 'numero' => 'S-1'],
    ['id' => 3, 'tipo' => 'suite', 'numero' => 'S-2'],
];

$reservas = [
    // Reserva existente que ocupa el tipo 'familiar' (placeholder o asignada)
    [
        'habitacion_id' => null, // placeholder sin habitación asignada
        'tipo' => 'familiar',
        'check_in' => '2026-01-31',
        'check_out' => '2026-02-02',
    ],
    // ejemplo de reserva asignada a suite
    [
        'habitacion_id' => 2,
        'tipo' => 'suite',
        'check_in' => '2026-01-30',
        'check_out' => '2026-02-01',
    ],
];

$requested = ['check_in' => '2026-01-31', 'check_out' => '2026-02-03'];
$reqStart = parseDate($requested['check_in']);
$reqEnd = parseDate($requested['check_out']);

$types = array_unique(array_map(function($r){ return $r['tipo']; }, $rooms));
$types = array_values($types);

$result = [];

foreach ($types as $tipo) {
    $roomsOfTipo = array_values(array_filter($rooms, function($r) use ($tipo) { return $r['tipo'] === $tipo; }));
    $roomIds = array_map(function($r){ return $r['id']; }, $roomsOfTipo);
    $totalRooms = count($roomIds);

    // contar reservas asignadas (habitacion_id not null) que solapan
    $assigned = [];
    $placeholders = 0;
    foreach ($reservas as $res) {
        $resStart = parseDate($res['check_in']);
        $resEnd = parseDate($res['check_out']);
        if (!overlaps($reqStart, $reqEnd, $resStart, $resEnd)) continue;

        if (!is_null($res['habitacion_id'])) {
            if (in_array($res['habitacion_id'], $roomIds)) {
                $assigned[$res['habitacion_id']] = true;
            }
        } else {
            if (($res['tipo'] ?? null) === $tipo) {
                $placeholders++;
            }
        }
    }

    $assignedCount = count($assigned);
    $availableSlots = max(0, $totalRooms - ($assignedCount + $placeholders));

    // listar habitaciones candidatas sin reservas asignadas que solapen
    $candidates = [];
    foreach ($roomsOfTipo as $r) {
        $hasOverlap = false;
        foreach ($reservas as $res) {
            if (is_null($res['habitacion_id'])) continue;
            if ($res['habitacion_id'] !== $r['id']) continue;
            if (overlaps($reqStart, $reqEnd, parseDate($res['check_in']), parseDate($res['check_out']))) { $hasOverlap = true; break; }
        }
        if (!$hasOverlap) $candidates[] = $r;
    }

    $selected = array_slice($candidates, 0, $availableSlots);

    $result[$tipo] = [
        'total' => $totalRooms,
        'assigned' => $assignedCount,
        'placeholders' => $placeholders,
        'available_slots' => $availableSlots,
        'selected_rooms' => $selected,
    ];
}

// Mostrar resultado
echo "Requested: {$requested['check_in']} -> {$requested['check_out']}\n\n";
foreach ($result as $tipo => $info) {
    echo strtoupper($tipo) . ":\n";
    echo "  total rooms: {$info['total']}\n";
    echo "  assigned overlapping: {$info['assigned']}\n";
    echo "  placeholders overlapping: {$info['placeholders']}\n";
    echo "  available_slots: {$info['available_slots']}\n";
    echo "  selected_rooms: ";
    if (empty($info['selected_rooms'])) echo "(none)\n"; else {
        $nums = array_map(function($r){ return $r['numero']; }, $info['selected_rooms']);
        echo implode(', ', $nums) . "\n";
    }
    echo "\n";
}

$expectedFamiliarAvailable = ($result['familiar']['available_slots'] ?? 0) > 0;
if (isset($result['familiar'])) {
    if ($expectedFamiliarAvailable) {
        echo "TEST FAILED: 'familiar' appears available but should not.\n";
        exit(1);
    } else {
        echo "TEST PASSED: 'familiar' is correctly not available.\n";
        exit(0);
    }
} else {
    echo "No hay habitaciones de tipo 'familiar' en el dataset. Ajusta el dataset para probar.\n";
    exit(2);
}
