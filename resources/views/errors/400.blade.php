@extends('layouts.app')

@section('title', '400 - Petición incorrecta')

@section('content')
<div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-2xl text-center p-8">
        <h1 class="text-6xl font-black text-yellow-600">400</h1>
        <h2 class="mt-4 text-2xl font-bold">Petición incorrecta</h2>
        <p class="mt-2 text-gray-500">La solicitud no pudo ser procesada debido a datos inválidos.</p>
        <div class="mt-6">
            <a href="{{ url()->previous() ?? route('home') }}" class="inline-block rounded-md bg-[#7a0202] px-5 py-3 text-white font-bold">Volver</a>
        </div>
    </div>
</div>
@endsection
