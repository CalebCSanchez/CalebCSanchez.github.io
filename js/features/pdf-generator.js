// PDF Resume Generation functionality
class PDFGenerator {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Resume generation
        const resumeBtn = document.getElementById('generate-resume');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.generateResume());
        }
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
                setTimeout(resolve, 100); // Small delay to ensure initialization
            };
            script.onerror = () => {
                reject(new Error('Failed to load jsPDF'));
            };
            document.head.appendChild(script);
        });
    }

    // PDF Generation from displayed content
    async generateResume() {
        // Show loading notification
        this.showNotification('Generating resume...', 'info');

        // Enhanced jsPDF detection and loading
        let jsPDFClass = null;
        
        // Try different ways to access jsPDF
        if (window.jsPDF) {
            jsPDFClass = window.jsPDF;
        } else if (window.jspdf && window.jspdf.jsPDF) {
            jsPDFClass = window.jspdf.jsPDF;
        } else if (typeof jsPDF !== 'undefined') {
            jsPDFClass = jsPDF;
        } else {
            
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
                // Fallback to browser print if jsPDF fails
                this.showNotification('PDF library failed to load. Using browser print as fallback...', 'info');
                this.generateResumeViaPrint();
                return;
            }
        }

        if (!jsPDFClass) {
            // Fallback to browser print if jsPDF not available
            this.showNotification('PDF library not available. Using browser print as fallback...', 'info');
            this.generateResumeViaPrint();
            return;
        }

        try {
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
}

// Make PDFGenerator globally available
if (typeof window !== 'undefined') {
    window.PDFGenerator = PDFGenerator;
}