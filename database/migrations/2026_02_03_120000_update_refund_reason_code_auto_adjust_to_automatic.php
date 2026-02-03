<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Update existing refund requests with the old code to the new one
        DB::table('refund_requests')
            ->where('reason_code', 'auto_adjust')
            ->update(['reason_code' => 'automatic']);
    }

    public function down()
    {
        // Revert the change if needed
        DB::table('refund_requests')
            ->where('reason_code', 'automatic')
            ->update(['reason_code' => 'auto_adjust']);
    }
};
