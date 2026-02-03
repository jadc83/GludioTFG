<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Simplified: add a helper column for reason_code changes instead of updating rows directly
        Schema::table('refund_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('refund_requests', 'reason_code_text')) {
                $table->string('reason_code_text')->nullable()->index();
            }
        });
    }

    public function down()
    {
        Schema::table('refund_requests', function (Blueprint $table) {
            if (Schema::hasColumn('refund_requests', 'reason_code_text')) {
                $table->dropColumn('reason_code_text');
            }
        });
    }
};
