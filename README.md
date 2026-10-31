# Caleb Sanchez - Portfolio Website

A clean, lightweight portfolio website built with pure HTML, CSS, and JavaScript.

## Features

- **Responsive Design**: Works perfectly on desktop and mobile
- **Modern Styling**: Cyberpunk-inspired theme with smooth animations
- **PDF Resume Generator**: Automatically generates a professional resume from portfolio content
- **Fast Loading**: No build system or heavy dependencies
- **Side Projects**: A hub linking to small projects (Halloween bingo and costume contest, Rock Breaker, Raven Timer)

## Technology Stack

- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern styling with gradients, animations, and flexbox/grid
- **JavaScript**: ES6+ with clean, modular code
- **jsPDF**: For client-side PDF generation

## File Structure

```
├── index.html            # Portfolio home page
├── assets/               # Portfolio CSS/JS, images, documents (PDFs are gitignored)
├── projects/             # Side projects hub + one folder per project
│   ├── rock-breaker/
│   └── raven-timer/
├── halloween/            # Event pages: bingo/ and rankchoice/ (Firebase)
├── tests/                # Unit tests, mirroring the source tree
├── archive/              # Retired files
├── firestore.rules       # Firebase security rules
└── .github/copilot-instructions.md
```

## Local Development

Serve the folder over HTTP (for example `python -m http.server`) and open `http://localhost:8000`. Paths are root-absolute and module scripts need HTTP, so `file://` will not work.

## Features Breakdown

### Sections
- **Hero**: Typing animation with call-to-action buttons
- **About**: Professional summary and highlights
- **Experience**: Timeline of professional roles with detailed achievements
- **Projects**: Featured personal and professional projects
- **Skills**: Technical skills with visual progress bars
- **Education**: Academic background
- **Contact**: Links to email, LinkedIn, and GitHub

### Functionality
- Smooth scrolling navigation
- Mobile-responsive hamburger menu
- Scroll-spy for active navigation states
- PDF resume generation from displayed content
- Intersection Observer for scroll animations
- Accessible design with proper focus management

## Contact

- **Email**: calebcsanchez1@gmail.com
- **LinkedIn**: [linkedin.com/in/calebcsanchez1](https://www.linkedin.com/in/calebcsanchez1)
- **GitHub**: [github.com/CalebCSanchez](https://github.com/CalebCSanchez)

---

Built with ❤️ using vanilla web technologies