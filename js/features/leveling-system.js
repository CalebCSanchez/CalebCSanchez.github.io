// Interactive Leveling System functionality
class LevelingSystem {
    constructor() {
        this.level = 1;
        this.experience = 0;
        this.maxExperience = 10;
        this.lastClickTime = null;
        this.interactiveMode = true;

        this.init();
    }

    init() {
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
}

// Make LevelingSystem globally available
if (typeof window !== 'undefined') {
    window.LevelingSystem = LevelingSystem;
}