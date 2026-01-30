/**
 * MinTax Group - Main JavaScript
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
});
