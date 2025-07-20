// Core Portfolio functionality - Navigation, animations, and basic interactions
class PortfolioCore {
    constructor() {
        this.isMenuOpen = false;
        this.currentSection = 'home';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initTypingAnimation();
        this.initScrollSpy();
        this.initScrollAnimations();
        this.initMobileMenu();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });

        // Mobile menu toggle
        const navToggle = document.getElementById('nav-toggle');
        if (navToggle) {
            navToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Scroll event for navbar
        window.addEventListener('scroll', () => this.handleScroll());

        // Close mobile menu on window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.isMenuOpen) {
                this.toggleMobileMenu();
            }
        });

        // Escape key to close mobile menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.toggleMobileMenu();
            }
        });
    }

    initTypingAnimation() {
        const typingElement = document.getElementById('typing-text');
        if (!typingElement) return;

        const text = "Caleb Sanchez";
        let index = 0;

        const typeWriter = () => {
            if (index < text.length) {
                typingElement.textContent += text.charAt(index);
                index++;
                setTimeout(typeWriter, 100);
            } else {
                // Hide cursor after typing is complete
                const cursor = document.getElementById('cursor');
                if (cursor) {
                    setTimeout(() => {
                        cursor.style.display = 'none';
                    }, 3000);
                }
            }
        };

        // Start typing after a short delay
        setTimeout(typeWriter, 1000);
    }

    initScrollSpy() {
        const sections = document.querySelectorAll('.section, .hero');
        const navLinks = document.querySelectorAll('.nav-link');

        const observerOptions = {
            threshold: 0.3,
            rootMargin: '-100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    this.updateActiveNavLink(sectionId);
                }
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));
    }

    updateActiveNavLink(sectionId) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === `#${sectionId}`) {
                link.classList.add('active');
            }
        });
    }

    initScrollAnimations() {
        const animateElements = document.querySelectorAll('.timeline-item, .project-card, .skill-category');
        
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                    setTimeout(() => {
                        entry.target.classList.add('fade-in-up');
                        entry.target.classList.add('animated');
                    }, index * 100);
                }
            });
        }, observerOptions);

        animateElements.forEach(element => {
            observer.observe(element);
        });
    }

    initMobileMenu() {
        // Close menu when clicking on nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (this.isMenuOpen) {
                    this.toggleMobileMenu();
                }
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            const navMenu = document.getElementById('nav-menu');
            const navToggle = document.getElementById('nav-toggle');
            
            if (this.isMenuOpen && 
                !navMenu.contains(e.target) && 
                !navToggle.contains(e.target)) {
                this.toggleMobileMenu();
            }
        });
    }

    handleNavClick(e) {
        const href = e.target.getAttribute('href');
        
        // Check if it's an external link (like rock-breaker.html)
        if (href && !href.startsWith('#')) {
            // Allow normal navigation for external links
            return;
        }
        
        // Handle internal navigation
        e.preventDefault();
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            const offsetTop = targetElement.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }

    toggleMobileMenu() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        this.isMenuOpen = !this.isMenuOpen;
        
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
    }

    handleScroll() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    // Utility function to scroll to top
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Utility function to get section data for external use
    getSectionData(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return null;
        
        return {
            title: section.querySelector('h2')?.textContent || '',
            content: section.textContent || ''
        };
    }
}

// Make PortfolioCore globally available
if (typeof window !== 'undefined') {
    window.PortfolioCore = PortfolioCore;
}