<?php
// Usage: php phpstan_top_files.php [N]
$path = __DIR__ . '/../phpstan-current.json';
if (!file_exists($path)) {
    fwrite(STDERR, "phpstan JSON not found at $path\n");
    exit(2);
}
$raw = file_get_contents($path);
// strip UTF-8 BOM if present
if (substr($raw, 0, 3) === "\xEF\xBB\xBF") {
    $raw = substr($raw, 3);
}
// handle UTF-16 BOMs
if (substr($raw, 0, 2) === "\xFF\xFE") {
    $raw = mb_convert_encoding($raw, 'UTF-8', 'UTF-16LE');
} elseif (substr($raw, 0, 2) === "\xFE\xFF") {
    $raw = mb_convert_encoding($raw, 'UTF-8', 'UTF-16BE');
}
// try to ensure valid UTF-8
if (!mb_check_encoding($raw, 'UTF-8')) {
    $raw = mb_convert_encoding($raw, 'UTF-8', 'Windows-1252');
}
$j = json_decode($raw, true);
if ($j === null) {
    fwrite(STDERR, "Failed to parse phpstan JSON (json_decode returned null). json_last_error_msg(): " . json_last_error_msg() . "\n");
    exit(3);
}
$topN = isset($argv[1]) && is_numeric($argv[1]) ? (int)$argv[1] : 20;
$list = [];
foreach ($j['files'] as $f => $v) {
    $list[$f] = $v['errors'];
}
arsort($list);
$i = 0;
foreach ($list as $f => $e) {
    echo sprintf("%4d  %s\n", $e, $f);

    // gather identifiers breakdown
    $ids = [];
    foreach ($j['files'][$f]['messages'] as $m) {
        $id = $m['identifier'] ?? 'unknown';
        $ids[$id]['count'] = ($ids[$id]['count'] ?? 0) + 1;
        if (!isset($ids[$id]['examples'])) $ids[$id]['examples'] = [];
        if (count($ids[$id]['examples']) < 3) $ids[$id]['examples'][] = trim($m['message']);
    }

    // sort identifiers by count
    arsort($ids);
    $k = 0;
    foreach ($ids as $id => $info) {
        echo sprintf("      - %3d  %s\n", $info['count'], $id);
        foreach ($info['examples'] as $ex) {
            echo "           » $ex\n";
        }
        $k++;
        if ($k >= 5) break;
    }

    echo "\n";
    if (++$i >= $topN) break;
}
