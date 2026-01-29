<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (Schema::hasTable('refund_requests')) {
            Schema::table('refund_requests', function (Blueprint $table) {
                if (! Schema::hasColumn('refund_requests', 'pending_check_in')) {
                    $table->date('pending_check_in')->nullable()->after('notes');
                }
                if (! Schema::hasColumn('refund_requests', 'pending_check_out')) {
                    $table->date('pending_check_out')->nullable()->after('pending_check_in');
                }
                if (! Schema::hasColumn('refund_requests', 'pending_nuevo_total')) {
                    $table->decimal('pending_nuevo_total', 10, 2)->nullable()->after('pending_check_out');
                }
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('refund_requests')) {
            Schema::table('refund_requests', function (Blueprint $table) {
                if (Schema::hasColumn('refund_requests', 'pending_check_in')) {
                    $table->dropColumn('pending_check_in');
                }
                if (Schema::hasColumn('refund_requests', 'pending_check_out')) {
                    $table->dropColumn('pending_check_out');
                }
                if (Schema::hasColumn('refund_requests', 'pending_nuevo_total')) {
                    $table->dropColumn('pending_nuevo_total');
                }
            });
        }
    }
};
