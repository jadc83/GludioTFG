<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('reembolsos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pago_id')->constrained('pagos')->onDelete('cascade');
            $table->foreignId('reserva_id')->constrained('reservas')->onDelete('cascade');
            $table->string('stripe_refund_id')->nullable()->index();
            $table->bigInteger('amount_cents')->nullable();
            $table->string('currency', 10)->nullable();
            $table->string('status')->nullable();
            $table->text('reason')->nullable();
            $table->json('stripe_response')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('reembolsos');
    }
};
