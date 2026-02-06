<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tareas', function (Blueprint $table) {
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete()->after('created_by');
            $table->timestamp('completed_at')->nullable()->after('completed_by');
        });
    }

    public function down(): void
    {
        Schema::table('tareas', function (Blueprint $table) {
            $table->dropColumn(['completed_at']);
            $table->dropConstrainedForeignId('completed_by');
        });
    }
};
