import '../../css/fondoLanding.css';

export default function Fondo() {
    return (
        <div className="componente-fondo-wrapper">
            <section className="hero-section" role="img" aria-label="Un hall de hotel elegante con el texto 'Donde la elegancia encuentra el confort'.">
                <div className="overlay" aria-hidden="true"></div>
                <div className="contenido">
                    <h1>
                        Donde la elegancia <br /> encuentra el confort
                    </h1>
                    <p>
                        Disfruta de una experiencia única con nuestro servicio
                        exclusivo.
                    </p>
                </div>
            </section>
        </div>
    );
}
