<?php
$path = __DIR__ . '/../phpstan-current.json';
$s = file_get_contents($path);
echo "len: " . strlen($s) . "\n";
$j = json_decode($s, true);
echo "is_null: " . ($j === null ? 'yes' : 'no') . "\n";
echo "err: " . json_last_error_msg() . "\n";
// show first 200 chars
echo "head: " . substr($s, 0, 200) . "\n";
?>
