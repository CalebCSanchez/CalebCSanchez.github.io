// Portfolio initialization and module coordination
class Portfolio {
    constructor() {
        this.portfolioCore = null;
        this.levelingSystem = null;
        this.pdfGenerator = null;
        this.init();
    }

    init() {
        // Initialize core portfolio functionality
        this.portfolioCore = new PortfolioCore();
        
        // Initialize leveling system
        this.levelingSystem = new LevelingSystem();
        
        // Initialize PDF generator
        this.pdfGenerator = new PDFGenerator();
    }

    // Utility function to scroll to top
    scrollToTop() {
        if (this.portfolioCore) {
            this.portfolioCore.scrollToTop();
        }
    }

    // Utility function to get section data for external use
    getSectionData(sectionId) {
        if (this.portfolioCore) {
            return this.portfolioCore.getSectionData(sectionId);
        }
        return null;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize portfolio
    window.portfolio = new Portfolio();
    
    // Make utils globally available (already done in helpers.js but ensure it's available)
    if (window.Utils) {
        window.utils = window.Utils;
    }
    
    // Add loading complete class to body
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 500);
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    // Page visibility handling (for future features)
});

// Error handling
window.addEventListener('error', (e) => {
    // Global error handling (for future logging)
});

// Performance monitoring
window.addEventListener('load', () => {
    // Performance monitoring (for future analytics)
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Portfolio, PortfolioCore, LevelingSystem, PDFGenerator, Utils };
}