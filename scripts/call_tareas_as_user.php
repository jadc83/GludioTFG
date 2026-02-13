<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\TareaController;

$usersToTest = [18,27]; // user_ids associated with empleado 17 and 22

foreach ($usersToTest as $uid) {
    echo "\n=== As user id={$uid} ===\n";
    Auth::logout();
    $user = \App\Models\User::find($uid);
    if (!$user) { echo "User {$uid} not found\n"; continue; }
    Auth::login($user);

    // Call index without empleado_id (should return user's empleado tasks)
    $req = Request::create('/api/tareas', 'GET', []);
    $req->setUserResolver(function() use ($user) { return $user; });

    $controller = new TareaController();
    $res = $controller->index($req);
    echo "Response status: " . $res->getStatusCode() . "\n";
    echo $res->getContent() . "\n";

    // Call index with empleado_id=17 explicitly
    $req2 = Request::create('/api/tareas?empleado_id=17', 'GET', ['empleado_id' => 17]);
    $req2->setUserResolver(function() use ($user) { return $user; });
    $res2 = $controller->index($req2);
    echo "Response (empleado_id=17) status: " . $res2->getStatusCode() . "\n";
    echo $res2->getContent() . "\n";
}
