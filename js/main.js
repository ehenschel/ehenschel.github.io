/**
 * MinTax Group — Main JavaScript V2
 * ═══════════════════════════════════
 * Scroll-reveal system, animated counters,
 * hero parallax, scroll progress, mobile menu
 */

(function () {
    'use strict';

    // Wait for DOM
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        headerScroll();
        mobileMenu();
        smoothScrollAnchors();
        scrollReveal();
        // animatedCounters(); — REMOVED: bouncing numbers feel cheap (V5 design decision)
        heroParallax();
        scrollProgress();
        currentYear();
        formEnhancements();
    }


    /* ═══════════════════════════════════
       1. HEADER SCROLL EFFECT
       ═══════════════════════════════════ */
    function headerScroll() {
        var header = document.getElementById('header');
        if (!header) return;

        var scrolled = false;
        window.addEventListener('scroll', function () {
            var shouldBeScrolled = window.scrollY > 50;
            if (shouldBeScrolled !== scrolled) {
                scrolled = shouldBeScrolled;
                header.classList.toggle('scrolled', scrolled);
            }
        }, { passive: true });
    }


    /* ═══════════════════════════════════
       2. MOBILE MENU
       ═══════════════════════════════════ */
    function mobileMenu() {
        var toggle = document.querySelector('.mobile-toggle');
        var nav = document.querySelector('.nav');
        var navLinks = document.querySelector('.nav-links');
        var body = document.body;

        if (!toggle || !nav) return;

        toggle.addEventListener('click', function () {
            this.classList.toggle('active');
            nav.classList.toggle('mobile-open');
            body.classList.toggle('menu-open');
        });

        if (navLinks) {
            navLinks.querySelectorAll('a').forEach(function (link) {
                link.addEventListener('click', function () {
                    toggle.classList.remove('active');
                    nav.classList.remove('mobile-open');
                    body.classList.remove('menu-open');
                });
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && nav.classList.contains('mobile-open')) {
                toggle.classList.remove('active');
                nav.classList.remove('mobile-open');
                body.classList.remove('menu-open');
            }
        });
    }


    /* ═══════════════════════════════════
       3. SMOOTH SCROLL FOR ANCHOR LINKS
       ═══════════════════════════════════ */
    function smoothScrollAnchors() {
        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
            anchor.addEventListener('click', function (e) {
                var href = this.getAttribute('href');
                if (href !== '#') {
                    e.preventDefault();
                    var target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });
    }


    /* ═══════════════════════════════════
       4. SCROLL-REVEAL SYSTEM
       ═══════════════════════════════════
       Works with both:
         - Explicit classes: .reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger
         - Auto-detected homepage elements (section headers, cards, grids)
    */
    function scrollReveal() {
        if (!('IntersectionObserver' in window)) {
            // Fallback: show everything immediately
            document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger, .animate-on-scroll, .stagger-children').forEach(function (el) {
                el.classList.add('is-visible');
                el.classList.add('animated');
            });
            return;
        }

        // Observe explicitly-classed elements
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    entry.target.classList.add('animated');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: '0px 0px -60px 0px',
            threshold: 0.08
        });

        var revealSelectors = '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger, .animate-on-scroll, .stagger-children, .animate-left, .animate-right, .animate-scale';
        document.querySelectorAll(revealSelectors).forEach(function (el) {
            revealObserver.observe(el);
        });

        // ── Auto-detect homepage elements ──
        // These selectors auto-get the .reveal or .reveal-stagger treatment
        var autoRevealMap = [
            // Section headers → reveal (fade-up)
            { selector: '.section-header', cls: 'reveal' },
            // Page headers
            { selector: '.page-header h1', cls: 'reveal' },
            { selector: '.page-header .lead', cls: 'reveal' },
            // Service hero
            { selector: '.service-hero h1', cls: 'reveal' },
            { selector: '.service-hero .lead', cls: 'reveal' },
            // Section subtitles/intros
            { selector: '.home-credentials h2', cls: 'reveal' },
            { selector: '.home-credentials .section-subtitle', cls: 'reveal' },
            { selector: '.home-credentials .overline', cls: 'reveal' },
            // Grids → stagger children
            { selector: '.services-grid', cls: 'reveal-stagger' },
            { selector: '.services-grid-2', cls: 'reveal-stagger' },
            { selector: '.industries-grid', cls: 'reveal-stagger' },
            { selector: '.insights-grid', cls: 'reveal-stagger' },
            { selector: '.people-grid', cls: 'reveal-stagger' },
            { selector: '.credentials-grid', cls: 'reveal-stagger' },
            // Case study — left/right reveal
            { selector: '.casestudy-content', cls: 'reveal-left' },
            { selector: '.casestudy-image', cls: 'reveal-right' },
            // News & Events
            { selector: '.news-column', cls: 'reveal' },
            { selector: '.events-column', cls: 'reveal' },
            // CTA
            { selector: '.cta-box', cls: 'reveal-scale' },
            // About
            { selector: '.about-content', cls: 'reveal' },
            { selector: '.about-image', cls: 'reveal-right' },
            // Contact
            { selector: '.contact-form-card', cls: 'reveal' },
            { selector: '.contact-info', cls: 'reveal' },
            // Service detail
            { selector: '.service-main h2', cls: 'reveal' },
            { selector: '.benefit-card', cls: 'reveal' },
        ];

        autoRevealMap.forEach(function (item) {
            document.querySelectorAll(item.selector).forEach(function (el) {
                // Don't double-apply if element already has a reveal class
                if (!el.classList.contains('reveal') &&
                    !el.classList.contains('reveal-left') &&
                    !el.classList.contains('reveal-right') &&
                    !el.classList.contains('reveal-scale') &&
                    !el.classList.contains('reveal-stagger') &&
                    !el.classList.contains('animate-on-scroll')) {
                    el.classList.add(item.cls);
                    revealObserver.observe(el);
                }
            });
        });
    }


    /* ═══════════════════════════════════
       5. ANIMATED NUMBER COUNTERS
       ═══════════════════════════════════
       Targets:
         .hero-stat-number  (26+, 500+, Top 10)
         .casestudy-metric-number ($12M+, 18, 100%)
         .stat-number (other pages)
    */
    function animatedCounters() {
        if (!('IntersectionObserver' in window)) return;

        var counterSelectors = '.hero-stat-number, .casestudy-metric-number, .stat-number';
        var counterElements = document.querySelectorAll(counterSelectors);
        if (!counterElements.length) return;

        var counterObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateElement(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.5,
            rootMargin: '0px'
        });

        counterElements.forEach(function (el) {
            // Store original text for reference
            el.setAttribute('data-counter-original', el.textContent.trim());
            counterObserver.observe(el);
        });
    }

    function animateElement(el) {
        var original = el.getAttribute('data-counter-original') || el.textContent.trim();

        // Parse the text to find numeric parts
        // Handles: "26+", "500+", "$12M+", "18", "100%", "Top 10"
        var match = original.match(/^([^\d]*)([\d,.]+)(.*)$/);
        if (!match) return; // Non-numeric like "Top 10" — leave as-is

        var prefix = match[1];   // "$" or ""
        var numStr = match[2];   // "12" or "500" or "100" or "26"
        var suffix = match[3];   // "M+" or "+" or "%" or ""
        var target = parseFloat(numStr.replace(/,/g, ''));

        if (isNaN(target) || target === 0) return;

        // Determine decimal places from original
        var decimals = 0;
        if (numStr.indexOf('.') !== -1) {
            decimals = numStr.split('.')[1].length;
        }

        // Animation parameters
        var duration = 2000; // 2 seconds
        var startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);

            // Ease-out cubic for satisfying deceleration
            var eased = 1 - Math.pow(1 - progress, 3);
            var current = eased * target;

            if (decimals > 0) {
                el.textContent = prefix + current.toFixed(decimals) + suffix;
            } else {
                el.textContent = prefix + Math.floor(current) + suffix;
            }

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                // Final value — ensure exact match
                el.textContent = original;
            }
        }

        // Start at zero
        el.textContent = prefix + '0' + suffix;
        requestAnimationFrame(step);
    }


    /* ═══════════════════════════════════
       6. HERO PARALLAX
       ═══════════════════════════════════
       Moves the hero background at 0.4x scroll speed
    */
    function heroParallax() {
        var hero = document.querySelector('.home-hero');
        if (!hero) return;

        // Use requestAnimationFrame for smooth performance
        var ticking = false;

        window.addEventListener('scroll', function () {
            if (!ticking) {
                requestAnimationFrame(function () {
                    var scrollY = window.scrollY;
                    var heroHeight = hero.offsetHeight;

                    // Only apply parallax while hero is visible
                    if (scrollY < heroHeight * 1.2) {
                        var translate = scrollY * 0.4;
                        hero.style.setProperty('--parallax-y', translate + 'px');

                        // Apply to the ::before pseudo via a CSS custom property
                        // We can't directly style ::before in JS, so we use a wrapper approach
                        var bgEl = hero.querySelector('.hero-parallax-bg');
                        if (bgEl) {
                            bgEl.style.transform = 'translateY(' + translate + 'px) scale(1.15)';
                        }
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }


    /* ═══════════════════════════════════
       7. SCROLL PROGRESS INDICATOR
       ═══════════════════════════════════
       Gold-to-terracotta bar at the top of the page
    */
    function scrollProgress() {
        // Only on homepage
        if (!document.querySelector('.home-hero')) return;

        var bar = document.createElement('div');
        bar.className = 'scroll-progress';
        bar.style.width = '0%';
        document.body.appendChild(bar);

        var ticking = false;
        window.addEventListener('scroll', function () {
            if (!ticking) {
                requestAnimationFrame(function () {
                    var scrollTop = window.scrollY;
                    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
                    var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
                    bar.style.width = progress + '%';
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }


    /* ═══════════════════════════════════
       8. CURRENT YEAR IN FOOTER
       ═══════════════════════════════════ */
    function currentYear() {
        var yearSpan = document.querySelector('.current-year');
        if (yearSpan) {
            yearSpan.textContent = new Date().getFullYear();
        }
    }


    /* ═══════════════════════════════════
       9. FORM ENHANCEMENTS
       ═══════════════════════════════════ */
    function formEnhancements() {
        var formInputs = document.querySelectorAll('.form-group input, .form-group textarea, .form-group select');

        formInputs.forEach(function (input) {
            input.addEventListener('focus', function () {
                var group = this.closest('.form-group');
                if (group) group.classList.add('focused');
            });

            input.addEventListener('blur', function () {
                var group = this.closest('.form-group');
                if (group) {
                    group.classList.remove('focused');
                    group.classList.toggle('has-value', !!this.value);
                }
            });
        });
    }

})();
