/**
 * MinTax Group - Main JavaScript
 * Includes: Navigation, Mobile Menu, Scroll Animations
 */

document.addEventListener('DOMContentLoaded', function() {
    // ========== HEADER SCROLL EFFECT ==========
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // ========== MOBILE MENU ==========
    const mobileToggle = document.querySelector('.mobile-toggle');
    const nav = document.querySelector('.nav');
    const navLinks = document.querySelector('.nav-links');
    const body = document.body;

    if (mobileToggle && nav) {
        mobileToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            nav.classList.toggle('mobile-open');
            body.classList.toggle('menu-open');
        });

        // Close menu when clicking on a link
        if (navLinks) {
            navLinks.querySelectorAll('a').forEach(function(link) {
                link.addEventListener('click', function() {
                    mobileToggle.classList.remove('active');
                    nav.classList.remove('mobile-open');
                    body.classList.remove('menu-open');
                });
            });
        }

        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && nav.classList.contains('mobile-open')) {
                mobileToggle.classList.remove('active');
                nav.classList.remove('mobile-open');
                body.classList.remove('menu-open');
            }
        });
    }

    // ========== SMOOTH SCROLL FOR ANCHOR LINKS ==========
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // ========== SCROLL ANIMATIONS ==========
    const animateElements = document.querySelectorAll('.animate-on-scroll, .animate-left, .animate-right, .animate-scale, .stagger-children');

    if (animateElements.length > 0 && 'IntersectionObserver' in window) {
        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        animateElements.forEach(function(el) {
            observer.observe(el);
        });
    } else {
        // Fallback: just show everything
        animateElements.forEach(function(el) {
            el.classList.add('animated');
        });
    }

    // ========== AUTO-ADD ANIMATION CLASSES ==========
    // Automatically add animation classes to common elements
    const autoAnimateSelectors = [
        '.section-header',
        '.service-card',
        '.credential-item',
        '.team-member',
        '.cta-box',
        '.contact-form-card',
        '.contact-info',
        '.page-header h1',
        '.page-header .lead',
        '.service-hero h1',
        '.service-hero .lead',
        '.home-hero-content',
        '.hero-visual',
        '.about-image',
        '.about-content',
        '.service-main h2',
        '.benefit-card'
    ];

    autoAnimateSelectors.forEach(function(selector) {
        document.querySelectorAll(selector).forEach(function(el, index) {
            if (!el.classList.contains('animate-on-scroll')) {
                el.classList.add('animate-on-scroll');
                el.style.transitionDelay = (index * 0.05) + 's';

                // Observe the new element
                if ('IntersectionObserver' in window) {
                    const observer = new IntersectionObserver(function(entries) {
                        entries.forEach(function(entry) {
                            if (entry.isIntersecting) {
                                entry.target.classList.add('animated');
                                observer.unobserve(entry.target);
                            }
                        });
                    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
                    observer.observe(el);
                }
            }
        });
    });

    // ========== STATS COUNTER ANIMATION ==========
    const statNumbers = document.querySelectorAll('.stat-number');

    if (statNumbers.length > 0 && 'IntersectionObserver' in window) {
        const statsObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const text = el.textContent;
                    const num = parseInt(text.replace(/\D/g, ''));

                    if (num && num < 1000) {
                        animateCounter(el, num, text.includes('+') ? '+' : '');
                    }
                    statsObserver.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(function(stat) {
            statsObserver.observe(stat);
        });
    }

    function animateCounter(el, target, suffix) {
        let current = 0;
        const increment = target / 40;
        const timer = setInterval(function() {
            current += increment;
            if (current >= target) {
                el.textContent = target + suffix;
                clearInterval(timer);
            } else {
                el.textContent = Math.floor(current) + suffix;
            }
        }, 30);
    }

    // ========== FORM ENHANCEMENTS ==========
    const formInputs = document.querySelectorAll('.form-group input, .form-group textarea, .form-group select');

    formInputs.forEach(function(input) {
        // Add focus class to parent
        input.addEventListener('focus', function() {
            this.closest('.form-group').classList.add('focused');
        });

        input.addEventListener('blur', function() {
            this.closest('.form-group').classList.remove('focused');
            if (this.value) {
                this.closest('.form-group').classList.add('has-value');
            } else {
                this.closest('.form-group').classList.remove('has-value');
            }
        });
    });

    // ========== CURRENT YEAR IN FOOTER ==========
    const yearSpan = document.querySelector('.current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
});
