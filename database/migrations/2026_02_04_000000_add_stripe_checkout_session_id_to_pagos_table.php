<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('pagos', function (Blueprint $table) {
            if (!Schema::hasColumn('pagos', 'stripe_checkout_session_id')) {
                $table->string('stripe_checkout_session_id')->nullable()->after('stripe_payment_intent_id');
            }
        });
    }

    public function down()
    {
        Schema::table('pagos', function (Blueprint $table) {
            if (Schema::hasColumn('pagos', 'stripe_checkout_session_id')) {
                $table->dropColumn('stripe_checkout_session_id');
            }
        });
    }
};
