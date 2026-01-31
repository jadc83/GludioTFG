<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (Schema::hasTable('refund_requests') && Schema::hasColumn('refund_requests', 'stripe_refund_id')) {
            Schema::table('refund_requests', function (Blueprint $table) {
                // Add index only if it does not exist
                $table->unique('stripe_refund_id', 'refund_requests_stripe_refund_id_unique');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('refund_requests') && Schema::hasColumn('refund_requests', 'stripe_refund_id')) {
            Schema::table('refund_requests', function (Blueprint $table) {
                $table->dropUnique('refund_requests_stripe_refund_id_unique');
            });
        }
    }
};
