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
        $viewerCheck = $request->user();
        try {
            if (! $viewerCheck) {
                abort(403);
            }

            $hasRoleMethod = method_exists($viewerCheck, 'hasRole');
            $isAdmin = $hasRoleMethod && $viewerCheck->hasRole('admin');
            $isEncargado = $hasRoleMethod && $viewerCheck->hasRole('encargado');

            if ($isAdmin || $isEncargado) {

            } elseif ($viewerCheck->empleado) {
                $dept = strtolower($viewerCheck->empleado->departamento?->name ?? '');
                $empRole = strtolower($viewerCheck->empleado->role ?? '');
                if (! (in_array($dept, ['recepcion', 'mantenimiento']) && in_array($empRole, ['operario', 'auxiliar', 'encargado']))) {
                    abort(403);
                }
            } else {
                abort(403);
            }
        } catch (\Throwable $e) {
            abort(403);
        }

        $requestedTab = $request->query('tab');
        if ($requestedTab === 'configuracion') {
            $viewer = $request->user();
            try {
                if (!($viewer && method_exists($viewer, 'hasRole') && $viewer->hasRole('admin'))) {
                    abort(403);
                }
            } catch (\Throwable $e) {
                abort(403);
            }
        }

        if ($requestedTab === 'estadisticas') {
            $viewer = $request->user();
            try {
                if (! $viewer) {
                    abort(403);
                }

                if (method_exists($viewer, 'hasRole') && $viewer->hasRole('admin')) {

                } elseif (method_exists($viewer, 'hasRole') && $viewer->hasRole('encargado')) {
                    $dept = strtolower($viewer->empleado?->departamento?->name ?? '');
                    if (in_array($dept, ['limpieza', 'mantenimiento'])) {
                        abort(403);
                    }
                } else {
                    abort(403);
                }
            } catch (\Throwable $e) {
                abort(403);
            }
        }
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

        if (($request->input('trashed') ?? '') === 'with') {
            $query = $query->withTrashed();
        } elseif (($request->input('trashed') ?? '') === 'only') {
            $query = $query->onlyTrashed();
        }

        $sortBy = $request->input('sort_by');
        $sortDir = strtolower($request->input('sort_dir') ?? 'desc') === 'asc' ? 'asc' : 'desc';

        if ($sortBy === 'created_at') {
            $reservas = $query->orderBy('created_at', $sortDir)->get();
        } else {
            $reservas = $query->orderBy('check_in', 'desc')->get();
        }

        $habitaciones = Habitacion::with('fotos')
            ->buscar($request->busqueda)
            ->estado($request->estado)
            ->tipo($request->tipo)
            ->capacidad($request->capacidad)
            ->precioMin($request->precio_min)
            ->precioMax($request->precio_max)
            ->orderBy('numero')
            ->get();

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

                try {
                    $roles = [];
                    if (method_exists($empleado->user, 'getRoleNames')) {
                        $roles = $empleado->user->getRoleNames()->toArray();
                    } elseif (isset($empleado->user->roles) && is_iterable($empleado->user->roles)) {
                        if ($empleado->user->roles instanceof \Illuminate\Support\Collection) {
                            $roles = $empleado->user->roles->map(fn($r) => $r->name ?? (string) $r)->filter()->values()->toArray();
                        } elseif (is_array($empleado->user->roles)) {
                            $roles = array_values($empleado->user->roles);
                        }
                    }
                } catch (\Throwable $e) {
                    $roles = [];
                }
                $data['roles'] = $roles;
                $data['role'] = $roles[0] ?? null;

                $depModel = $empleado->relationLoaded('departamento') ? $empleado->getRelation('departamento') : (\App\Models\Departamento::find($empleado->departamento_id));
                $data['departamento'] = $depModel ? $depModel->name : null;
                $data['departamento_id'] = $empleado->departamento_id ?? null;
            }
            return $data;
        });

        $clientes->each(function ($c) { $c->tipo_usuario = 'cliente'; });
        $usuarios->each(function ($u) { $u->tipo_usuario = 'user'; });

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
            'openEdit'                => $request->query('edited') ? true : false,
            'habitacionToEdit'        => $request->query('edited') ? Habitacion::with('fotos')->find($request->query('edited')) : null,
        ]);
    }
}
