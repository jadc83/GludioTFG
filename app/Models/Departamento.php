<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Departamento extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    protected static function booted()
    {
        // Normalize name to Title Case before saving to avoid case duplicates
        static::saving(function ($model) {
            if (isset($model->name)) {
                $model->name = mb_convert_case(mb_strtolower(trim($model->name)), MB_CASE_TITLE, "UTF-8");
            }
        });
    }

    public function empleados()
    {
        return $this->hasMany(Empleado::class, 'departamento_id');
    }
}
