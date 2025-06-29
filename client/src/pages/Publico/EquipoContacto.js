import React, { useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './EquipoContacto.css';
import { Logo, LogoMunicipal, LogoFoji, IglesiaPiedra } from '../../utils/images';
import { initAllAnimations } from '../../utils/animations';

const profesores = [
  {
    nombre: 'Leidy Enriquez',
    especialidad: 'Violoncello, Directora de Orquesta',
    img: 'https://randomuser.me/api/portraits/women/44.jpg',
    bio: 'Directora de la Orquesta Juvenil de Cobquecura y profesora de violoncello. Apasionada por la formación musical y el desarrollo artístico de los jóvenes, con amplia experiencia en dirección y docencia musical.',
  },
  {
    nombre: 'Francisco Quezada',
    especialidad: 'Violín',
    img: 'https://randomuser.me/api/portraits/men/45.jpg',
    bio: 'Profesor de violín con más de 10 años de experiencia en la enseñanza musical. Su enfoque pedagógico fomenta la disciplina y la creatividad, inspirando a cada estudiante a alcanzar su máximo potencial.',
  },
  {
    nombre: 'Camilo Tapia',
    especialidad: 'Viola',
    img: 'https://randomuser.me/api/portraits/men/46.jpg',
    bio: 'Violinista y violista dedicado a la formación de jóvenes músicos. Destaca por su cercanía y motivación en el aula, creando un ambiente de aprendizaje positivo y estimulante.',
  },
  {
    nombre: 'Felipe Torres',
    especialidad: 'Contrabajo y Teoría Musical',
    img: 'https://randomuser.me/api/portraits/men/47.jpg',
    bio: 'Profesor de contrabajo y teoría musical con sólida formación académica. Su pasión por la música y la enseñanza se refleja en el progreso constante de sus estudiantes.',
  },
  {
    nombre: 'Francisco Sepúlveda',
    especialidad: 'Percusión',
    img: 'https://randomuser.me/api/portraits/men/48.jpg',
    bio: 'Percusionista con amplia trayectoria en orquestas juveniles y profesionales. Destaca por su energía y dedicación, transmitiendo entusiasmo y técnica precisa a cada estudiante.',
  },
];

const EquipoContacto = () => {
  const navigate = useNavigate();

  // Función para el viewport height dinámico
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  useEffect(() => {
    // Configurar viewport height
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    // Agregar clase al body para el fondo
    document.body.classList.add('vista-equipo-contacto-body');
    
    // Múltiples métodos para asegurar que siempre inicie desde arriba
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // También con setTimeout para asegurar que se ejecute después del render
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 0);
    
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 100);

    // Inicializar animaciones después de que el componente se monte
    setTimeout(() => {
      initAllAnimations();
    }, 100);

    // Verificar si hay un hash en la URL para hacer scroll a contacto
    setTimeout(() => {
      if (window.location.hash === '#contacto') {
        const contactSection = document.getElementById('contacto');
        if (contactSection) {
          contactSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    }, 500);

    // Limpiar la clase cuando se desmonte el componente
    return () => {
      document.body.classList.remove('vista-equipo-contacto-body');
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  return (
    <div className="vista-equipo-contacto">
      {/* Header con imagen de fondo - SIN LOGO */}
      <header className="header-equipo-contacto" style={{backgroundImage: `url(${IglesiaPiedra})`}}>
        <Container>
          <Row className="align-items-center min-vh-100">
            <Col lg={12}>
              <div className="hero-content text-center">
                <h1 className="titulo-equipo-contacto text-white mb-4 hero-title-animate">
                  Nuestro Equipo de Profesores
                </h1>
                <p className="subtitulo-equipo-contacto text-white mb-4 hero-subtitle-animate">
                  Conoce a los músicos profesionales y docentes apasionados que forman y guían a los jóvenes talentos de nuestra orquesta.
                </p>
                <div className="hero-buttons-animate">
                  <Button 
                    variant="light" 
                    size="lg"
                    className="btn-regreso"
                    onClick={() => navigate('/')}
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Volver al inicio
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </header>

      {/* Sección de introducción */}
      <section className="seccion-intro-equipo-contacto">
        <Container>
          <div className="intro-equipo-contacto fade-in-up">
            <h2>
              <i className="fas fa-music me-3"></i>
              Formadores de talento musical
            </h2>
            <p className="lead">
              Nuestro equipo está conformado por músicos profesionales comprometidos con la excelencia educativa y el desarrollo integral de cada estudiante. Descubre sus trayectorias, especialidades y la pasión que los motiva día a día.
            </p>
          </div>
        </Container>
      </section>

      {/* Grid de profesores */}
      <section className="seccion-equipo-contacto">
        <Container>
          <Row className="grid-equipo-contacto justify-content-center">
            {profesores.map((prof, idx) => (
              <Col key={idx} md={6} lg={4}>
                <Card className="card-equipo-contacto card-animate">
                  <div className="imagen-equipo-contacto-container">
                    <img
                      src={prof.img}
                      alt={prof.nombre}
                      className="imagen-equipo-contacto"
                    />
                  </div>
                  <div className="contenido-equipo-contacto">
                    <h4 className="nombre-equipo-contacto">{prof.nombre}</h4>
                    <h6 className="especialidad-equipo-contacto">{prof.especialidad}</h6>
                    <p className="bio-equipo-contacto">{prof.bio}</p>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Contacto - LAYOUT HORIZONTAL CORREGIDO */}
      <section id="contacto" className="py-5 bg-azul-claro text-white">
        <Container>
          <Row>
            <Col lg={10} className="mx-auto text-center">
              <div className="contacto-fade-in-up fade-in-up">
                <h2 className="mb-4">
                  <i className="fas fa-envelope me-3"></i>
                  Contacto
                </h2>
                <p className="lead mb-4">
                  ¿Tienes preguntas o quieres ser parte de nuestra orquesta?
                </p>
              </div>
              
              {/* Layout horizontal con flexbox */}
              <div className="contacto-items-row">
                <div className="item-contacto contacto-fade-in-up slide-in-left">
                  <i className="fas fa-phone fa-2x"></i>
                  <h5>Teléfono</h5>
                  <p>+56 9 1234 5678</p>
                </div>
                
                <div className="item-contacto contacto-fade-in-up fade-in-up">
                  <i className="fas fa-envelope fa-2x"></i>
                  <h5>Email</h5>
                  <p>info@orquestacobquecura.cl</p>
                </div>
                
                <div className="item-contacto contacto-fade-in-up slide-in-right">
                  <i className="fas fa-map-marker-alt fa-2x"></i>
                  <h5>Dirección</h5>
                  <p>Cobquecura, Región del Ñuble</p>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer - EXACTAMENTE IGUAL AL DE VISTA PUBLICA */}
      <footer className="footer-equipo-contacto">
        <Container>
          <Row className="justify-content-center align-items-center">
            <Col md={12} className="text-center mb-2">
              <div className="d-flex justify-content-center align-items-center flex-wrap">
                <img src={Logo} alt="Logo Orquesta" className="logo-footer logo-orquesta-footer" />
                <img src={LogoMunicipal} alt="Logo Municipal" className="logo-footer logo-municipal-footer" />
                <img src={LogoFoji} alt="Logo FOJI" className="logo-footer logo-foji-footer" />
              </div>
            </Col>
            <Col md={12} className="text-center">
              <p className="mb-1 small">&copy; 2025 Orquesta Juvenil de Cobquecura. Todos los derechos reservados.</p>
              <small className="opacity-75">
                Fomentando la música y cultura en nuestra comunidad
              </small>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default EquipoContacto;