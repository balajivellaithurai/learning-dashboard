const fs = require('fs');
const glob = require('glob'); // maybe not standard, let's just use simple recursive search or specify files

const cssPath = 'src/index.css';
let css = fs.readFileSync(cssPath, 'utf8');

// Replace everything up to BASE with standard sleek UI configs
const newVars = `:root {
  /* ==================== CLEAN LIGHT ==================== */
  --bg-color: #f8fafc;
  --bg-dots: rgba(148, 163, 184, 0.1);
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  --card-bg: #ffffff;
  --card-bg-alt: #f1f5f9;
  --input-bg: #ffffff;

  --accent-yellow: #f59e0b;
  --accent-pink: #ec4899;
  --accent-blue: #3b82f6;
  --accent-green: #10b981;
  --accent-orange: #f97316;
  --accent-purple: #8b5cf6;
  --accent-cyan: #06b6d4;
  --accent-lime: #84cc16;

  --primary-btn: #2563eb;
  --danger-btn: #ef4444;

  --card-radius: 12px;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --transition-theme: all 0.2s ease;
}

[data-theme="dark"] {
  /* ==================== CLEAN DARK ==================== */
  --bg-color: #0f172a;
  --bg-dots: rgba(255, 255, 255, 0.03);
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --border-color: #334155;
  --card-bg: #1e293b;
  --card-bg-alt: #0f172a;
  --input-bg: #0f172a;

  --accent-yellow: #fbbf24;
  --accent-pink: #f472b6;
  --accent-blue: #60a5fa;
  --accent-green: #34d399;
  --accent-orange: #fb923c;
  --accent-purple: #a78bfa;
  --accent-cyan: #22d3ee;
  --accent-lime: #a3e635;

  --primary-btn: #3b82f6;
  --danger-btn: #f87171;

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
}
`;

css = css.replace(/:root\s*\{[\s\S]*?\}\s*\[data-theme="dark"\]\s*\{[\s\S]*?\}(?=\s*\/\*\s*=+ BASE =+\s*\*\/)/, newVars);

// Replace extreme shadow classes and thick borders across the entire CSS
css = css.replace(/border: 4px solid var\(--border-color\)/g, 'border: 1px solid var(--border-color)');
css = css.replace(/border: 3px solid var\(--border-color\)/g, 'border: 1px solid var(--border-color)');
css = css.replace(/border: 2px solid var\(--border-color\)/g, 'border: 1px solid var(--border-color)');
css = css.replace(/border-top: 3px dashed var\(--border-color\)/g, 'border-top: 1px solid var(--border-color)');
css = css.replace(/box-shadow: \d+px \d+px 0px [^;]+;/g, 'box-shadow: var(--shadow-sm);');

// Remove rainbow nth-child cards and headers completely
css = css.replace(/\.brutal-card:nth-child\(\dn\+\d\)\s*\{[\s\S]*?\}/g, '');
css = css.replace(/\.chapter-card:nth-child\(\dn\+\d\)\s*\.chapter-header\s*\{[\s\S]*?\}/g, '');
css = css.replace(/\[data-theme="dark"\] \.brutal-card:nth-child\(6n\+\d\)\s*\{[\s\S]*?\}/g, '');
css = css.replace(/\[data-theme="dark"\] \.chapter-card:nth-child\(6n\+\d\)\s*\{[\s\S]*?\}/g, '');

// Strip the crazy Dark mode block overrides entirely
css = css.replace(/\/\* ==================== DARK MODE CARD OVERRIDES.*?@media/s, '@media');
css = css.replace(/\/\* ==================== DARK MODE CLEAN SHADOWS.*?@media/s, '@media');
css = css.replace(/\/\* ==================== DARK MODE REFINED BORDERS & SHADOWS.*?@media/s, '@media');

// Clean up weird transformations on hover
css = css.replace(/transform:\s*translate\([^)]+\)\s*rotate\([^)]+\)(?:\s*scale\([^)]+\))?;/g, 'transform: translateY(-2px);');
css = css.replace(/transform:\s*translate\([^)]+\)(?:\s*scale\([^)]+\))?;/g, 'transform: translateY(-2px);');

fs.writeFileSync(cssPath, css);

// Fix jsx hardcoded inline styles
const files = [
    'src/pages/QuizPage.jsx',
    'src/pages/InstructorQuizBuilder.jsx',
    'src/pages/AdminDashboard.jsx',
    'src/pages/CoursePage.jsx',
    'src/components/CoursePdfs.jsx'
];

files.forEach(f => {
    if (fs.existsSync(f)) {
        let content = fs.readFileSync(f, 'utf8');
        content = content.replace(/3px solid var\(--border-color\)/g, '1px solid var(--border-color)');
        content = content.replace(/3px dashed var\(--border-color\)/g, '1px solid var(--border-color)');
        content = content.replace(/4px 4px 0px var\(--border-color\)/g, 'var(--shadow-sm)');
        fs.writeFileSync(f, content);
    }
});
console.log('Cleaned CSS and JSX completely.');
