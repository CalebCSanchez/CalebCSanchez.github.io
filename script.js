document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('nav ul li a');
    const sections = Array.from(document.querySelectorAll('section'));	
    const endSpace = document.getElementById('end-space');

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

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
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
        });
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
		showMessage("Their name's are bean and cheese :)");
        catImage.classList.add('visible');
    });

    noButton.addEventListener('click', () => {
        hidePrompt();
        showMessage("Oh :(");
    });
});
