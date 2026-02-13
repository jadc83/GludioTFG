import BarraBuscador from '@/Components/UI/BarraBuscador';

export default function ControlesFiltros(props) {
    // Wrapper mínimo para exponer un componente en español. Props se pasan a BarraBuscador.
    return <BarraBuscador {...props} />;
}
