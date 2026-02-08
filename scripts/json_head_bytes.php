<?php
$path = __DIR__ . '/../phpstan-current.json';
$s = file_get_contents($path);
for ($i = 0; $i < 12; $i++) {
    $c = isset($s[$i]) ? ord($s[$i]) : null;
    printf("%2d: %s (%s)\n", $i, var_export($c, true), isset($s[$i]) ? $s[$i] : '');
}
?>
