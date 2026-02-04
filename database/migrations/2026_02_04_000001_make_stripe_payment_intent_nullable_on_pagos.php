<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Requires doctrine/dbal when using change(); ensure it's available in the environment
        Schema::table('pagos', function (Blueprint $table) {
            $table->string('stripe_payment_intent_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            $table->string('stripe_payment_intent_id')->nullable(false)->change();
        });
    }
};
