// Portfolio JavaScript - Clean and Lightweight
class Portfolio {
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
        this.initLevelingSystem();
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

        // Resume generation
        const resumeBtn = document.getElementById('generate-resume');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.generateResume());
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
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
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

    // ==================== LEVELING SYSTEM ====================
    
    initLevelingSystem() {
        // Load progress from cookies
        this.loadProgress();
        
        // Get DOM elements
        this.levelDisplay = document.getElementById('level');
        this.progressBar = document.getElementById('progress-bar');
        this.levelMessage = document.getElementById('level-message');
        this.promptContainer = document.getElementById('prompt-container');
        this.promptMessage = document.getElementById('prompt-message');
        this.yesButton = document.getElementById('yes-button');
        this.noButton = document.getElementById('no-button');
        this.catImage = document.getElementById('cat-image');
        this.introImage = document.getElementById('intro-image');
        this.levelUpSystem = document.getElementById('level-up-system');
        this.tutorialOverlay = document.getElementById('tutorial-overlay');
        this.startClickingBtn = document.getElementById('start-clicking');
        this.interactiveModeToggle = document.getElementById('interactive-mode-toggle');
        this.levelToggle = document.getElementById('level-toggle');
        this.sadFaceMessage = document.getElementById('sad-face-message');
        this.settingsToggle = document.getElementById('settings-toggle');
        this.settingsPanel = document.getElementById('settings-panel');
        this.restartButton = document.getElementById('restart-progress');
        
        // Interactive mode state
        this.interactiveMode = this.getCookie('interactiveMode') !== 'false'; // Default to true
        
        // Initialize display with saved values
        this.updateLevelDisplay();
        this.updateProgressBar();
        this.initializeToggleStates();
        
        this.setupLevelingEventListeners();
        this.showHintSystem();
    }
    
    setupLevelingEventListeners() {
        // Track all clickable elements for leveling
        this.setupGlobalClickTracking();
        
        // Prompt button listeners
        if (this.yesButton) {
            this.yesButton.addEventListener('click', () => this.handleCatPromptYes());
        }
        
        if (this.noButton) {
            this.noButton.addEventListener('click', () => this.handleCatPromptNo());
        }
        
        // Cat image click to close
        if (this.catImage) {
            this.catImage.addEventListener('click', () => this.hideCatImage());
        }
        
        // Start clicking button
        if (this.startClickingBtn) {
            this.startClickingBtn.addEventListener('click', () => this.hideTutorial());
        }

        // Interactive mode toggles
        if (this.interactiveModeToggle) {
            this.interactiveModeToggle.addEventListener('change', (e) => this.toggleInteractiveMode(e.target.checked));
        }
        
        if (this.levelToggle) {
            this.levelToggle.addEventListener('change', (e) => this.toggleInteractiveMode(e.target.checked));
        }

        // Settings panel toggle
        if (this.settingsToggle) {
            this.settingsToggle.addEventListener('click', () => this.toggleSettingsPanel());
        }

        // Restart progress button
        if (this.restartButton) {
            this.restartButton.addEventListener('click', () => this.restartProgress());
        }

        // Close prompt on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hidePrompt();
                this.hideCatImage();
                this.hideHintSystem();
                this.hideTutorial();
                
                // Close settings panel
                if (this.settingsPanel && !this.settingsPanel.classList.contains('hidden')) {
                    this.toggleSettingsPanel();
                }
            }
        });
    }
    
    setupGlobalClickTracking() {
        // Track clicks on various interactive elements
        const clickableSelectors = [
            'a', 'button', '.nav-link', '.contact-link', '.btn', 
            '.project-card a', '.skill-item', '.timeline-item',
            '[href]', '[onclick]', '.clickable'
        ];
        
        clickableSelectors.forEach(selector => {
            document.addEventListener('click', (e) => {
                const target = e.target.closest(selector);
                if (target && this.shouldCountClick(target)) {
                    this.gainExperience();
                }
            });
        });
    }
    
    shouldCountClick(element) {
        // Don't count clicks if interactive mode is disabled
        if (!this.interactiveMode) {
            return false;
        }
        
        // Don't count clicks on leveling system elements
        if (element.closest('#level-up-system, #prompt-container, #cat-image, .level-message, #tutorial-overlay')) {
            return false;
        }
        
        // Don't count rapid clicking (anti-spam)
        const now = Date.now();
        if (this.lastClickTime && (now - this.lastClickTime) < 500) {
            return false;
        }
        this.lastClickTime = now;
        
        return true;
    }
    
    initializeToggleStates() {
        // Set toggle states based on saved preference
        if (this.interactiveModeToggle) {
            this.interactiveModeToggle.checked = this.interactiveMode;
        }
        if (this.levelToggle) {
            this.levelToggle.checked = this.interactiveMode;
        }
        
        // Apply initial state
        this.updateInteractiveModeUI();
    }
    
    toggleInteractiveMode(enabled) {
        this.interactiveMode = enabled;
        this.setCookie('interactiveMode', enabled.toString(), 365);
        
        // Sync both toggles
        if (this.interactiveModeToggle) {
            this.interactiveModeToggle.checked = enabled;
        }
        if (this.levelToggle) {
            this.levelToggle.checked = enabled;
        }
        
        this.updateInteractiveModeUI();
        
        if (!enabled) {
            // Close all popups when interactive mode is disabled
            this.hidePrompt();
            this.hideCatImage();
            this.hideTutorial();
            this.hideIntroImage();
            this.showSadFace();
        } else {
            this.reviveLevelSystem();
        }
    }
    
    updateInteractiveModeUI() {
        if (this.levelUpSystem) {
            if (this.interactiveMode) {
                this.levelUpSystem.classList.remove('disabled');
            } else {
                this.levelUpSystem.classList.add('disabled');
            }
        }
    }
    
    showSadFace() {
        if (this.sadFaceMessage) {
            this.sadFaceMessage.classList.remove('hidden');
            this.sadFaceMessage.classList.add('visible');
            
            setTimeout(() => {
                this.sadFaceMessage.classList.remove('visible');
                this.sadFaceMessage.classList.add('hidden');
            }, 2000);
        }
    }
    
    reviveLevelSystem() {
        if (this.levelUpSystem) {
            this.levelUpSystem.classList.remove('disabled');
            this.levelUpSystem.classList.add('reviving');
            
            setTimeout(() => {
                this.levelUpSystem.classList.remove('reviving');
            }, 1000);
            
            // Show happy message
            this.displayLevelMessage("🎉 Interactive mode is back! Time to level up!");
        }
    }
    
    toggleSettingsPanel() {
        if (this.settingsPanel && this.settingsToggle) {
            const isHidden = this.settingsPanel.classList.contains('hidden');
            
            if (isHidden) {
                this.settingsPanel.classList.remove('hidden');
                this.settingsToggle.classList.add('expanded');
            } else {
                this.settingsPanel.classList.add('hidden');
                this.settingsToggle.classList.remove('expanded');
            }
        }
    }
    
    restartProgress() {
        // Show confirmation
        const confirmRestart = confirm('Are you sure you want to restart your progress? This will reset your level back to 1 and clear all achievements.');
        
        if (confirmRestart) {
            // Clear ALL cookies related to the portfolio
            this.clearCookie('portfolioLevel');
            this.clearCookie('portfolioExperience');
            this.clearCookie('portfolioMaxExperience');
            this.clearCookie('hasSeenCats');
            this.clearCookie('hasSeenTutorial');
            this.clearCookie('interactiveMode');
            
            // Refresh the page to reset everything
            window.location.reload();
        }
    }
    
    clearCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
    
    gainExperience() {
        this.experience += 5;
        
        // Update progress bar
        this.updateProgressBar();
        
        // Check for level up
        if (this.experience >= this.maxExperience) {
            this.levelUp();
        }
        
        // Hide intro image after first click
        this.hideIntroImage();
    }
    
    updateProgressBar() {
        const progressPercent = (this.experience / this.maxExperience) * 100;
        if (this.progressBar) {
            this.progressBar.style.width = `${progressPercent}%`;
        }
    }
    
    levelUp() {
        this.experience = 0;
        this.level++;
        
        // Update level display
        this.updateLevelDisplay();
        
        // Add level up effect
        if (this.levelUpSystem) {
            this.levelUpSystem.classList.add('level-up-effect');
            setTimeout(() => {
                this.levelUpSystem.classList.remove('level-up-effect');
            }, 1000);
        }
        
        // Show level-specific messages
        this.showLevelMessage();
        
        // Double the experience requirement
        this.maxExperience = this.maxExperience * 2;
        
        // Update progress bar
        this.updateProgressBar();
        
        // Save progress
        this.saveProgress();
    }
    
    // Cookie Management
    loadProgress() {
        const savedLevel = this.getCookie('portfolioLevel');
        const savedExperience = this.getCookie('portfolioExperience');
        const savedMaxExperience = this.getCookie('portfolioMaxExperience');
        
        this.level = savedLevel ? parseInt(savedLevel) : 1;
        this.experience = savedExperience ? parseInt(savedExperience) : 0;
        this.maxExperience = savedMaxExperience ? parseInt(savedMaxExperience) : 10;
    }
    
    saveProgress() {
        this.setCookie('portfolioLevel', this.level, 365);
        this.setCookie('portfolioExperience', this.experience, 365);
        this.setCookie('portfolioMaxExperience', this.maxExperience, 365);
    }
    
    setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }
    
    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    
    updateLevelDisplay() {
        if (this.levelDisplay) {
            this.levelDisplay.textContent = this.level;
        }
    }
    
    showLevelMessage() {
        let message = '';
        
        switch(this.level) {
            case 2:
                message = "WOW! You're getting the hang of this!";
                break;
            case 3:
                message = "AWESOME! Keep clicking!";
                break;
            case 4:
                message = "Can you reach level 10?";
                break;
            case 5:
                message = "You're really dedicated!";
                break;
            case 6:
                this.showCatPrompt();
                return; // Don't show regular message for level 6
            case 7:
                message = "Level 7! You're unstoppable!";
                break;
            case 8:
                message = "Level 8! Almost there!";
                break;
            case 9:
                message = "Level 9! One more to go!";
                break;
            case 10:
                message = "Wait you actually sat here and kept clicking?";
                break;
            default:
                if (this.level > 10) {
                    message = `Level ${this.level}! You're a clicking legend!`;
                }
                break;
        }
        
        if (message) {
            this.displayLevelMessage(message);
        }
    }
    
    displayLevelMessage(message) {
        if (this.levelMessage) {
            this.levelMessage.textContent = message;
            this.levelMessage.classList.remove('hidden');
            this.levelMessage.classList.add('visible');
            
            setTimeout(() => {
                this.levelMessage.classList.remove('visible');
                this.levelMessage.classList.add('hidden');
            }, 3000);
        }
    }
    
    showCatPrompt() {
        // Don't show popup if interactive mode is disabled
        if (!this.interactiveMode) {
            return;
        }
        
        if (this.promptContainer && this.promptMessage) {
            // Close any other overlays
            this.hideTutorial();
            this.hideCatImage();
            
            this.promptMessage.textContent = "Want to see a picture of my cats? :)";
            this.promptContainer.classList.remove('hidden');
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }
    }
    
    hidePrompt() {
        if (this.promptContainer) {
            this.promptContainer.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }
    
    handleCatPromptYes() {
        this.hidePrompt();
        this.showCatImage();
        this.displayLevelMessage("Their names are Bean and Cheese :)");
        this.setCookie('hasSeenCats', 'true', 365); // Remember they've seen the cats
    }
    
    handleCatPromptNo() {
        this.hidePrompt();
        this.displayLevelMessage("Oh :( Maybe next time!");
    }
    
    showCatImage() {
        if (this.catImage) {
            // Close any other overlays
            this.hidePrompt();
            this.hideTutorial();
            
            this.catImage.classList.remove('hidden');
            this.catImage.classList.add('visible');
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }
    }
    
    hideCatImage() {
        if (this.catImage) {
            this.catImage.classList.remove('visible');
            this.catImage.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }
    
    // Hint System
    showHintSystem() {
        // Don't show hints if interactive mode is disabled
        if (!this.interactiveMode) {
            return;
        }
        
        // Show tutorial for first-time visitors or low-level users
        if (this.level === 1 && !this.getCookie('hasSeenTutorial')) {
            this.showTutorial();
        } else if (this.level < 3) {
            this.showIntroImage();
            this.showMotivationalMessage();
        }
    }
    
    showTutorial() {
        // Don't show tutorial if interactive mode is disabled
        if (!this.interactiveMode) {
            return;
        }
        
        if (this.tutorialOverlay) {
            setTimeout(() => {
                // Double check interactive mode is still enabled after timeout
                if (!this.interactiveMode) {
                    return;
                }
                
                // Close any other overlays
                this.hidePrompt();
                this.hideCatImage();
                
                this.tutorialOverlay.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }, 2000); // Show after 2 seconds
        }
    }
    
    hideTutorial() {
        if (this.tutorialOverlay) {
            this.tutorialOverlay.classList.add('hidden');
            document.body.style.overflow = '';
            this.setCookie('hasSeenTutorial', 'true', 365);
            
            // Show intro image after tutorial is closed
            setTimeout(() => {
                this.showIntroImage();
            }, 500);
        }
    }
    
    showMotivationalMessage() {
        // Show initial motivation after a few seconds
        setTimeout(() => {
            if (this.interactiveMode && this.level < 3) {
                this.displayLevelMessage("🎯 Explore my portfolio! Each click levels you up!");
            }
        }, 2000);
        
        // Show reminder if they haven't clicked anything after a while
        setTimeout(() => {
            if (this.interactiveMode && this.level === 1) {
                this.displayLevelMessage("💡 Try clicking navigation links, projects, or skills!");
            }
        }, 10000);
        
        // Show cat teaser if they're progressing but haven't reached level 6
        setTimeout(() => {
            if (this.interactiveMode && this.level >= 3 && this.level < 6) {
                this.displayLevelMessage("🐱 Something special awaits at level 6...");
            }
        }, 15000);
    }
    
    showIntroImage() {
        // Don't show intro image if interactive mode is disabled
        if (!this.interactiveMode) {
            return;
        }
        
        if (this.introImage) {
            setTimeout(() => {
                // Double check interactive mode is still enabled after timeout
                if (this.interactiveMode) {
                    this.introImage.classList.add('fade-in');
                }
            }, 3000); // Show after 3 seconds
        }
    }
    
    hideIntroImage() {
        if (this.introImage) {
            this.introImage.classList.remove('fade-in');
            this.introImage.classList.add('hidden');
        }
    }
    
    hideHintSystem() {
        this.hideIntroImage();
        this.hideTutorial();
    }

    // Dynamic jsPDF loading function
    async loadJsPDFDynamically() {
        return new Promise((resolve, reject) => {
            // Check if script already exists
            if (document.querySelector('script[src*="jspdf"]')) {
                // Script exists, wait a bit more for it to load
                setTimeout(() => {
                    resolve();
                }, 2000);
                return;
            }

            // Create and load script dynamically
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                console.log('jsPDF loaded dynamically');
                setTimeout(resolve, 100); // Small delay to ensure initialization
            };
            script.onerror = () => {
                console.error('Failed to load jsPDF dynamically');
                reject(new Error('Failed to load jsPDF'));
            };
            document.head.appendChild(script);
        });
    }

    // PDF Generation from displayed content
    async generateResume() {
        console.log('Generate resume called');
        console.log('window.jsPDF:', window.jsPDF);
        console.log('Available globals:', Object.keys(window).filter(key => key.toLowerCase().includes('pdf')));

        // Show loading notification
        this.showNotification('Generating resume...', 'info');

        // Enhanced jsPDF detection and loading
        let jsPDFClass = null;
        
        // Try different ways to access jsPDF
        if (window.jsPDF) {
            console.log('Found jsPDF on window');
            jsPDFClass = window.jsPDF;
        } else if (window.jspdf && window.jspdf.jsPDF) {
            console.log('Found jsPDF in window.jspdf');
            jsPDFClass = window.jspdf.jsPDF;
        } else if (typeof jsPDF !== 'undefined') {
            console.log('Found jsPDF as global');
            jsPDFClass = jsPDF;
        } else {
            console.log('jsPDF not found, attempting to load dynamically');
            
            // Try to load jsPDF dynamically if not found
            try {
                await this.loadJsPDFDynamically();
                
                // Check again after dynamic loading
                if (window.jsPDF) {
                    jsPDFClass = window.jsPDF;
                } else if (typeof jsPDF !== 'undefined') {
                    jsPDFClass = jsPDF;
                } else {
                    throw new Error('Could not load jsPDF library');
                }
            } catch (error) {
                console.error('Failed to load jsPDF:', error);
                // Fallback to browser print if jsPDF fails
                this.showNotification('PDF library failed to load. Using browser print as fallback...', 'info');
                this.generateResumeViaPrint();
                return;
            }
        }

        if (!jsPDFClass) {
            console.error('jsPDF class is null');
            // Fallback to browser print if jsPDF not available
            this.showNotification('PDF library not available. Using browser print as fallback...', 'info');
            this.generateResumeViaPrint();
            return;
        }

        try {
            console.log('Creating PDF with jsPDF class:', jsPDFClass);
            const doc = new jsPDFClass();
            
            // Set up PDF
            doc.setProperties({
                title: 'Caleb Sanchez - Resume',
                subject: 'Professional Resume',
                author: 'Caleb Sanchez',
                keywords: 'resume, software engineer, full-stack developer',
                creator: 'Portfolio Website'
            });

            let yPosition = 20;
            const margin = 20;
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const contentWidth = pageWidth - (margin * 2);

            // Helper function to add text with word wrapping
            const addText = (text, x, y, options = {}) => {
                const fontSize = options.fontSize || 10;
                const maxWidth = options.maxWidth || contentWidth;
                const fontStyle = options.fontStyle || 'normal';
                const color = options.color || [0, 0, 0];
                
                doc.setTextColor(color[0], color[1], color[2]);
                doc.setFontSize(fontSize);
                doc.setFont('helvetica', fontStyle);
                
                const lines = doc.splitTextToSize(text, maxWidth);
                doc.text(lines, x, y);
                return y + (lines.length * (fontSize * 0.5));
            };

            // Header with professional styling - reduced height
            doc.setFillColor(34, 47, 62);
            doc.rect(0, 0, pageWidth, 28, 'F');
            
            // Name
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('CALEB SANCHEZ', margin, 15);
            
            // Title
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text('Full-Stack Developer', margin, 23);

            yPosition = 32;
            doc.setTextColor(0, 0, 0);

            // Contact info below header - single line
            doc.setFontSize(9);
            doc.text('Email: calebcsanchez1@gmail.com | LinkedIn: linkedin.com/in/calebcsanchez1 | Portfolio: calebcsanchez.github.io', margin, yPosition);
            yPosition += 8;

            // Professional Summary with border
            doc.setDrawColor(34, 47, 62);
            doc.setLineWidth(0.5);
            doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
            
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('PROFESSIONAL SUMMARY', margin, yPosition);
            yPosition += 10;
            
            const summary = 'Experienced Full-Stack Developer specializing in .NET Framework with 5+ years of expertise in backend development, API creation, and performance optimization. Currently serving as Software Engineer II at AIPSO, leading modernization of legacy systems and enhancing proprietary underwriting applications. Proven track record of resolving 90+ defects, delivering 200+ feature tickets, and optimizing enterprise application performance.';
            yPosition = addText(summary, margin, yPosition, { fontSize: 9 }) + 6;

            // Technical Skills section
            doc.setDrawColor(34, 47, 62);
            doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
            
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('TECHNICAL EXPERTISE', margin, yPosition);
            yPosition += 10;
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text('Backend Technologies:', margin, yPosition);
            yPosition += 3;
            doc.setFont('helvetica', 'normal');
            doc.text('C# (.NET Framework/.NET 8), SQL Server, Golang, Python, WinForms, ASP.NET', margin + 5, yPosition);
            yPosition += 5;
            
            doc.setFont('helvetica', 'bold');
            doc.text('Frontend Technologies:', margin, yPosition);
            yPosition += 3;
            doc.setFont('helvetica', 'normal');
            doc.text('ReactJS, Blazor, HTML5/CSS3, JavaScript', margin + 5, yPosition);
            yPosition += 5;
            
            doc.setFont('helvetica', 'bold');
            doc.text('Tools & DevOps:', margin, yPosition);
            yPosition += 3;
            doc.setFont('helvetica', 'normal');
            doc.text('Visual Studio 2022, Azure DevOps, Docker, Git, PowerShell, IIS, Jenkins', margin + 5, yPosition);
            yPosition += 8;

            // Professional Experience section
            doc.setDrawColor(34, 47, 62);
            doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
            
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('PROFESSIONAL EXPERIENCE', margin, yPosition);
            yPosition += 10;

            // Current position
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text('Software Engineer II', margin, yPosition);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text('November 2024 - Present', pageWidth - margin - 40, yPosition);
            yPosition += 4;
            
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.text('AIPSO, Remote', margin, yPosition);
            yPosition += 5;
            
            const aipsoAchievements = [
                '• Enhanced proprietary C# WinForms underwriting application serving multiple state insurance plans',
                '• Modernized legacy VB/.NET modules into maintainable C# classes, documenting patterns for future web migration',
                '• Resolved 90+ defects and story tickets since onboarding, improving application stability and reducing support escalations',
                '• Optimized SQL queries, stored procedures, and data-repair scripts ensuring data integrity across rating tables',
                '• Delivered features in 4-week Agile sprints using Azure DevOps, conducting code reviews and mentoring junior developers'
            ];
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            aipsoAchievements.forEach(achievement => {
                yPosition = addText(achievement, margin, yPosition, { fontSize: 8 }) + 2;
            });
            yPosition += 5;

            // Previous position
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text('Lead .NET Full-Stack Developer & Release Manager', margin, yPosition);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text('February 2023 - November 2024', pageWidth - margin - 50, yPosition);
            yPosition += 4;
            
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.text('Finys, Troy, MI', margin, yPosition);
            yPosition += 5;
            
            const finysAchievements = [
                '• Built and upgraded farm-insurance line for Maine, integrating with existing carrier frameworks and policy modules',
                '• Orchestrated three production releases, coordinating developers, QA, configuration promotion, and post-release support',
                '• Delivered 200+ tickets across new features and defects, implementing performance optimizations for improved transaction speeds',
                '• Trained teammates on new frameworks while strengthening communication and problem-solving skills'
            ];
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            finysAchievements.forEach(achievement => {
                yPosition = addText(achievement, margin, yPosition, { fontSize: 8 }) + 2;
            });
            yPosition += 5;

            // Contract work - Platos Closet
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text('Contract Software Developer', margin, yPosition);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text('March 2025 - August 2025', pageWidth - margin - 45, yPosition);
            yPosition += 4;
            
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.text('Plato\'s Closet, Remote', margin, yPosition);
            yPosition += 4;
            
            const contractAchievements = [
                '• Modernized legacy cash management system using React 18, .NET Framework 4.7.2 Web API, and SQL Server',
                '• Resolved critical variance calculation bugs causing incorrect negative variance reporting in retail operations',
                '• Delivered fully functional solution within 2 months including comprehensive testing and deployment',
                '• Built responsive UI with React, Tailwind CSS, and Chart.js for enhanced cash operations user experience'
            ];
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            contractAchievements.forEach(achievement => {
                yPosition = addText(achievement, margin, yPosition, { fontSize: 8 }) + 2;
            });
            yPosition += 4;

            // Menlo (compressed)
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text('Software Developer', margin, yPosition);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text('March 2022 - February 2023', pageWidth - margin - 50, yPosition);
            yPosition += 4;
            
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.text('Menlo Innovations, Ann Arbor, MI', margin, yPosition);
            yPosition += 4;
            
            const menloAchievements = [
                '• Backend development using Golang and Java with Spring Boot, optimizing performance through multithreading',
                '• Full-stack development with ReactJS, Python, and C# following Agile methodologies'
            ];
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            menloAchievements.forEach(achievement => {
                yPosition = addText(achievement, margin, yPosition, { fontSize: 8 }) + 2;
            });
            yPosition += 5;

            // Education section
            doc.setDrawColor(34, 47, 62);
            doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('EDUCATION', margin, yPosition);
            yPosition += 7;
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('Bachelor of Science, Computer Science', margin, yPosition);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text('May 2019', pageWidth - margin - 20, yPosition);
            yPosition += 4;
            
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.text('Texas Tech University, Whitacre College of Engineering | Minor in Mathematics', margin, yPosition);

            // Footer - moved up significantly
            const footerY = yPosition + 15;
            doc.setTextColor(128, 128, 128);
            doc.setFontSize(7);
            doc.text('Generated from portfolio: calebcsanchez.github.io', margin, footerY);

            // Save the PDF
            doc.save('Caleb_Sanchez_Resume.pdf');
            
            // Show success message
            this.showNotification('Resume generated successfully!', 'success');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.showNotification('Error generating resume. Please try again.', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ? '#4ade80' : type === 'error' ? '#ef4444' : '#00d4ff',
            color: '#000',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: '10000',
            fontSize: '14px',
            fontWeight: '600',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Fallback resume generation using browser print
    generateResumeViaPrint() {
        // Create a new window with resume content
        const resumeWindow = window.open('', '_blank', 'width=800,height=600');
        
        // Generate resume HTML content
        const resumeHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Caleb Sanchez - Resume</title>
    <style>
        @media print {
            @page { margin: 0.5in; }
            body { font-family: Arial, sans-serif; line-height: 1.4; color: black; }
        }
        body { font-family: Arial, sans-serif; line-height: 1.4; max-width: 8.5in; margin: 0 auto; padding: 20px; }
        .header { background: #222f3e; color: white; padding: 20px; margin: -20px -20px 20px -20px; }
        .header h1 { margin: 0; font-size: 28px; }
        .header .subtitle { font-size: 16px; margin: 5px 0; }
        .header .contact { font-size: 12px; margin-top: 10px; }
        .section { margin-bottom: 20px; }
        .section h2 { border-bottom: 2px solid #222f3e; color: #222f3e; font-size: 16px; margin-bottom: 10px; }
        .job { margin-bottom: 15px; }
        .job h3 { margin: 0; font-size: 14px; }
        .job .company { font-style: italic; color: #666; }
        .job .date { float: right; font-size: 12px; color: #666; }
        .tech-skills div { margin-bottom: 8px; }
        .tech-skills strong { color: #222f3e; }
        ul { margin: 5px 0; padding-left: 20px; }
        li { margin-bottom: 2px; font-size: 12px; }
        p { margin: 5px 0; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>CALEB SANCHEZ</h1>
        <div class="subtitle">Full-Stack Developer</div>
        <div class="contact">
            Email: calebcsanchez1@gmail.com | LinkedIn: linkedin.com/in/calebcsanchez1 | Portfolio: calebcsanchez.github.io
        </div>
    </div>

    <div class="section">
        <h2>PROFESSIONAL SUMMARY</h2>
        <p>Experienced Full-Stack Developer specializing in .NET Framework with 5+ years of expertise in backend development, API creation, and performance optimization. Currently serving as Software Engineer II at AIPSO, leading modernization of legacy systems and enhancing proprietary underwriting applications. Proven track record of resolving 90+ defects, delivering 200+ feature tickets, and optimizing enterprise application performance.</p>
    </div>

    <div class="section">
        <h2>TECHNICAL EXPERTISE</h2>
        <div class="tech-skills">
            <div><strong>Backend Technologies:</strong><br>
            C# (.NET Framework/.NET 8), SQL Server, Golang, Python, WinForms, ASP.NET</div>
            <div><strong>Frontend Technologies:</strong><br>
            ReactJS, Blazor, HTML5/CSS3, JavaScript</div>
            <div><strong>Tools & DevOps:</strong><br>
            Visual Studio 2022, Azure DevOps, Docker, Git, PowerShell, IIS, Jenkins</div>
        </div>
    </div>

    <div class="section">
        <h2>PROFESSIONAL EXPERIENCE</h2>
        
        <div class="job">
            <h3>Software Engineer II <span class="date">November 2024 - Present</span></h3>
            <div class="company">AIPSO, Remote</div>
            <ul>
                <li>Enhanced proprietary C# WinForms underwriting application serving multiple state insurance plans</li>
                <li>Modernized legacy VB/.NET modules into maintainable C# classes, documenting patterns for future web migration</li>
                <li>Resolved 90+ defects and story tickets since onboarding, improving application stability and reducing support escalations</li>
                <li>Optimized SQL queries, stored procedures, and data-repair scripts ensuring data integrity across rating tables</li>
                <li>Delivered features in 4-week Agile sprints using Azure DevOps, conducting code reviews and mentoring junior developers</li>
            </ul>
        </div>

        <div class="job">
            <h3>Lead .NET Full-Stack Developer & Release Manager <span class="date">February 2023 - November 2024</span></h3>
            <div class="company">Finys, Troy, MI</div>
            <ul>
                <li>Built and upgraded farm-insurance line for Maine, integrating with existing carrier frameworks and policy modules</li>
                <li>Orchestrated three production releases, coordinating developers, QA, configuration promotion, and post-release support</li>
                <li>Delivered 200+ tickets across new features and defects, implementing performance optimizations for improved transaction speeds</li>
                <li>Trained teammates on new frameworks while strengthening communication and problem-solving skills</li>
            </ul>
        </div>

        <div class="job">
            <h3>Contract Software Developer <span class="date">March 2025 - August 2025</span></h3>
            <div class="company">Plato's Closet, Remote</div>
            <ul>
                <li>Modernized legacy cash management system using React 18, .NET Framework 4.7.2 Web API, and SQL Server</li>
                <li>Resolved critical variance calculation bugs causing incorrect negative variance reporting in retail operations</li>
                <li>Delivered fully functional solution within 2 months including comprehensive testing and deployment</li>
                <li>Built responsive UI with React, Tailwind CSS, and Chart.js for enhanced cash operations user experience</li>
            </ul>
        </div>

        <div class="job">
            <h3>Software Developer <span class="date">March 2022 - February 2023</span></h3>
            <div class="company">Menlo Innovations, Ann Arbor, MI</div>
            <ul>
                <li>Backend development using Golang and Java with Spring Boot, optimizing performance through multithreading</li>
                <li>Full-stack development with ReactJS, Python, and C# following Agile methodologies</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <h2>EDUCATION</h2>
        <div class="job">
            <h3>Bachelor of Science, Computer Science <span class="date">May 2019</span></h3>
            <div class="company">Texas Tech University, Whitacre College of Engineering | Minor in Mathematics</div>
        </div>
    </div>

    <script>
        window.onload = function() {
            // Automatically trigger print dialog
            window.print();
            
            // Close window after printing (with delay to allow print dialog)
            setTimeout(function() {
                window.close();
            }, 1000);
        };
    </script>
</body>
</html>`;

        resumeWindow.document.write(resumeHTML);
        resumeWindow.document.close();
        
        this.showNotification('Resume opened in new window. Use Ctrl+P or Cmd+P to save as PDF.', 'success');
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

// Utility functions
const Utils = {
    // Smooth scroll to element
    scrollToElement(selector, offset = 80) {
        const element = document.querySelector(selector);
        if (element) {
            const elementTop = element.offsetTop - offset;
            window.scrollTo({
                top: elementTop,
                behavior: 'smooth'
            });
        }
    },

    // Debounce function for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    // Format date
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize portfolio
    window.portfolio = new Portfolio();
    
    // Make utils globally available
    window.utils = Utils;
    
    // Add loading complete class to body
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 500);
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden
        console.log('Page hidden');
    } else {
        // Page is visible
        console.log('Page visible');
    }
});

// Error handling
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

// Performance monitoring
window.addEventListener('load', () => {
    if ('performance' in window) {
        const loadTime = performance.now();
        console.log(`Page loaded in ${loadTime.toFixed(2)}ms`);
    }
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Portfolio, Utils };
}