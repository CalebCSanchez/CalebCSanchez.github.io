document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('nav ul li a');
    const mobileNavLinks = document.querySelectorAll('.mobile-menu a');
    const sections = Array.from(document.querySelectorAll('section'));	
    const endSpace = document.getElementById('end-space');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    const typingElement = document.getElementById('typing');
    const text = "Caleb Sanchez";
    let index = 0;

    function type() {
        if (index < text.length) {
            typingElement.innerHTML += text.charAt(index);
            index++;
            setTimeout(type, 100);
        } else {
            typingElement.style.border = 'none'; 
        }
    }

    setTimeout(type, 500); 

    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        mobileMenu.classList.toggle('visible');
    });

    // Handle navigation clicks (both desktop and mobile)
    function handleNavClick(e) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);

        sections.forEach(section => {
            section.classList.remove('appear');
        });

        const newOrder = [targetElement, ...sections.filter(section => section !== targetElement)];

        newOrder.forEach((section, index) => {
            document.body.appendChild(section);
            setTimeout(() => {
                section.classList.add('appear');
            }, index * 200); 
        });

        document.body.appendChild(endSpace);
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        const introImage = document.getElementById('intro-image');
        if (introImage) {
            introImage.remove();
        }

        // Close mobile menu if open
        if (!mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
            mobileMenu.classList.remove('visible');
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', handleNavClick);
    });

    mobileNavLinks.forEach(link => {
        link.addEventListener('click', handleNavClick);
    });

    const sectionHeaders = document.querySelectorAll('header li');
    const progressBar = document.getElementById('progress-bar');
    const levelDisplay = document.getElementById('level');
    const levelMessage = document.getElementById('level-message');
    const promptContainer = document.getElementById('prompt-container');
    const promptMessage = document.getElementById('prompt-message');
    const yesButton = document.getElementById('yes-button');
    const noButton = document.getElementById('no-button');
	const catImage = document.getElementById('cat-image');
    let experience = 0;
    let maxExperience = 10;
    let level = 1;

    function showMessage(message) {
        levelMessage.textContent = message;
        levelMessage.classList.remove('hidden');
        levelMessage.classList.add('visible');
        setTimeout(() => {
            levelMessage.classList.remove('visible');
            levelMessage.classList.add('hidden');
        }, 3000);
    }

    function showPrompt(message) {
        promptMessage.textContent = message;
        promptContainer.classList.remove('hidden');
        promptContainer.classList.add('visible');
        
        // Center the prompt
        const rect = promptContainer.getBoundingClientRect();
        promptContainer.style.position = 'fixed';
        promptContainer.style.top = '50%';
        promptContainer.style.left = '50%';
        promptContainer.style.transform = 'translate(-50%, -50%)';
        promptContainer.style.padding = '20px';
        promptContainer.style.maxWidth = '400px';
        promptContainer.style.width = '90%';
    }

    function hidePrompt() {
        promptContainer.classList.remove('visible');
        promptContainer.classList.add('hidden');
    }

    sectionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            experience += 5;
            if (experience >= maxExperience) {
                experience = 0;
                level++;
                levelDisplay.textContent = level;
                if (level === 2) {
                    showMessage("WOW!");
                } else if (level === 3) {
                    showMessage("AWESOME!");
                } else if (level === 4){
					showMessage("Can you reach level 10?");
				} else if (level === 6) {
                    showPrompt("Want to see a picture of my cats? :)");
                } else if (level === 10) {
                    showMessage("Wait you actually sat here and kept clicking?");
                }
				maxExperience = maxExperience * 2;
            }
            progressBar.style.width = `${(experience / maxExperience) * 100}%`;

            const introImage = document.getElementById('intro-image');
            if (introImage) {
                introImage.remove();
            }
        });
    });

    const introImage = document.getElementById('intro-image');
    setTimeout(() => {
        if (introImage) {
            introImage.classList.add('fade-in');
        }
    }, 5000);

    yesButton.addEventListener('click', () => {
        hidePrompt();
		showMessage("Their names are Bean and Cheese :)");
        catImage.classList.remove('hidden');
        catImage.classList.add('visible');
    });

    noButton.addEventListener('click', () => {
        hidePrompt();
        showMessage("Oh :(");
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
            if (!mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('visible');
            }
        }
    });

    // Smooth scrolling for banner CTA
    const bannerCTA = document.querySelector('.banner-cta');
    if (bannerCTA) {
        bannerCTA.addEventListener('click', (e) => {
            // Since this now links to an external site, we don't need to prevent default
            // Just let it open the external link naturally
            // The target="_blank" in the HTML will handle opening in a new tab
        });
    }
});
