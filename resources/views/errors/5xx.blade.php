@extends('layouts.app')

@section('title', 'Error del servidor')

@section('content')
<div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-2xl text-center p-8">
        <h1 class="text-6xl font-black text-red-600">Error</h1>
        <h2 class="mt-4 text-2xl font-bold">Se ha producido un error en el servidor</h2>
        <p class="mt-2 text-gray-500">Inténtalo de nuevo más tarde. Si el problema persiste, contacta con soporte.</p>
        <div class="mt-6">
            <a href="{{ route('home') }}" class="inline-block rounded-md bg-[#7a0202] px-5 py-3 text-white font-bold">Volver al inicio</a>
        </div>
    </div>
</div>
@endsection
