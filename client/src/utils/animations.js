// Función para animar contadores con números incrementales
export const animateCounter = (targetAttribute, endValue) => {
    // Buscar elemento por atributo data-counter o por ID
    let element = document.querySelector(`[data-counter="${targetAttribute}"]`);
    
    if (!element) {
        element = document.getElementById(`counter-${targetAttribute}`);
    }
    
    if (!element) {
        console.warn(`No se encontró elemento con data-counter="${targetAttribute}"`);
        return;
    }

    // Evitar re-animar si ya fue animado
    if (element.classList.contains('counter-animated')) return;

    element.classList.add('counter-animated');

    const startValue = 0;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing para animación suave
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart);
        
        element.textContent = currentValue;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            element.textContent = endValue;
        }
    };

    requestAnimationFrame(animate);
};

// Función para animaciones de scroll
export const initScrollAnimations = () => {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, observerOptions);

    // Observar elementos con clases de animación - AGREGADO slide-in-left
    const animatedElements = document.querySelectorAll('.fade-in-up, .slide-in-right, .slide-in-left, .card-animate, .counter-animate, .stat-item, .contacto-fade-in-up, .item-contacto');
    animatedElements.forEach(el => observer.observe(el));
};

// Función para inicializar todas las animaciones
export const initAllAnimations = () => {
    initScrollAnimations();
    
    // Animar elementos visibles al cargar
    setTimeout(() => {
        const visibleElements = document.querySelectorAll('.fade-in-up, .slide-in-right, .slide-in-left, .hero-title-animate, .hero-subtitle-animate, .contacto-fade-in-up');
        visibleElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                el.classList.add('animate');
            }
        });
    }, 100);
    
    // Forzar animación de contacto después de un tiempo
    setTimeout(() => {
        const contactElements = document.querySelectorAll('.item-contacto, .contacto-fade-in-up');
        contactElements.forEach(el => {
            el.classList.add('animate');
        });
    }, 1000);
};