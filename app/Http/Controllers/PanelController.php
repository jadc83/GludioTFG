<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Habitacion;
use App\Models\Reserva;
use App\Models\User;
use App\Models\Empleado;
use App\Models\Cupon;
use App\Models\TipoHabitacion;
use App\Services\ReservaService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PanelController extends Controller
{
    protected ReservaService $reservaService;

    public function __construct(ReservaService $reservaService)
    {
        $this->reservaService = $reservaService;
    }

    /**
     * Render panel view with filtered resources for admin dashboard
     *
     * @param \Illuminate\Http\Request $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $clientes = Cliente::buscar($request->busqueda)
            ->tipoDocumento($request->tipo_documento)
            ->orderBy('name')
            ->get();

        $usuarios = User::buscar($request->busqueda)
            ->tipoDocumento($request->tipo_documento)
            ->orderBy('name')
            ->get();

        $query = Reserva::with(['reservable', 'habitaciones.habitacion', 'pagos'])
            ->status($request->status)
            ->localizador($request->localizador)
            ->cliente($request->cliente)
            ->habitacion($request->habitacion);

        // Soporte para mostrar registros eliminados (soft deletes) desde el panel
        if (($request->input('trashed') ?? '') === 'with') {
            $query = $query->withTrashed();
        } elseif (($request->input('trashed') ?? '') === 'only') {
            $query = $query->onlyTrashed();
        }

        $reservas = $query->orderBy('check_in', 'desc')->get();

        $habitaciones = Habitacion::with('fotos')
            ->buscar($request->busqueda)
            ->estado($request->estado)
            ->tipo($request->tipo)
            ->capacidad($request->capacidad)
            ->precioMin($request->precio_min)
            ->precioMax($request->precio_max)
            ->orderBy('numero')
            ->get();

        // Empleados (unimos algunos campos del usuario para simplificar el front)
        $empleados = Empleado::with(['user','departamento'])->orderBy('id')->get()->map(function ($empleado) {
            $data = $empleado->toArray();
            if ($empleado->user) {
                $data['name'] = $empleado->user->name;
                $data['email'] = $empleado->user->email;
                $data['tipo_documento'] = $empleado->user->tipo_documento;
                $data['numero_documento'] = $empleado->user->numero_documento;
                $data['nacionalidad'] = $empleado->user->nacionalidad;
                $data['direccion'] = $empleado->user->direccion;
                $data['ciudad'] = $empleado->user->ciudad;
                $data['codigo_postal'] = $empleado->user->codigo_postal;
                $data['telefono'] = $empleado->user->telefono;
                // roles/role: exponer el primer rol y la lista completa para uso en el front
                try {
                    $roles = $empleado->user->getRoleNames()->toArray();
                } catch (\Throwable $e) {
                    $roles = [];
                }
                $data['roles'] = $roles;
                $data['role'] = $roles[0] ?? null;

                // departamento (relación a departamentos)
                $depModel = $empleado->relationLoaded('departamento') ? $empleado->getRelation('departamento') : (\App\Models\Departamento::find($empleado->departamento_id));
                $data['departamento'] = $depModel ? $depModel->name : null;
                $data['departamento_id'] = $empleado->departamento_id ?? null;
            }
            return $data;
        });

        // snapshot de clientes (logging temporal eliminado)

        // Marcar tipo de origen y combinar clientes+usuarios, prefiriendo Cliente en caso de duplicado
        $clientes->each(function ($c) { $c->tipo_usuario = 'cliente'; });
        $usuarios->each(function ($u) { $u->tipo_usuario = 'user'; });

        // Excluir usuarios cuyo id ya exista en clientes para preferir el registro de Cliente
        $clientesIds = $clientes->pluck('id')->all();
        $usuariosFiltrados = $usuarios->reject(function ($u) use ($clientesIds) {
            return in_array($u->id, $clientesIds);
        });

        $clientesFiltrados = $clientes->concat($usuariosFiltrados)->sortBy('name')->values();

        return Inertia::render('Panel/PanelControl', [
            'habitaciones'            => $habitaciones,
            'habitacionesDisponibles' => HabitacionController::getDisponibles($request->check_in, $request->check_out),
            'clientes'                => Cliente::orderBy('name')->get(),
            'users'                   => User::orderBy('name')->get(),
            'clientesFiltrados'       => $clientesFiltrados,
            'reservas'                => $this->reservaService->formatearReservas($reservas),
            'empleados'               => $empleados,
            'cupones'                 => Cupon::paginate(15),
            'tiposHabitacion'         => TipoHabitacion::all(),
        ]);
    }
}
