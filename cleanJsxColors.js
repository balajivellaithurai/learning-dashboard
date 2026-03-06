const fs = require('fs');
const files = [
    'src/pages/QuizPage.jsx',
    'src/pages/InstructorDashboard.jsx',
    'src/pages/InstructorQuizBuilder.jsx',
    'src/pages/AdminDashboard.jsx',
    'src/pages/CoursePage.jsx',
    'src/pages/Login.jsx'
];

files.forEach(f => {
    if (fs.existsSync(f)) {
        let content = fs.readFileSync(f, 'utf8');
        // Remove background: var(--accent-...)
        content = content.replace(/background:\s*['"]var\(--accent-[a-z]+\)['"]/g, '""');
        // Remove color: #1a1a2e
        content = content.replace(/color:\s*['"]#1a1a2e['"]/g, '""');
        // For style={{ "", "", ... }} this might break syntax if it leaves empty keys or something
        // A safer way is to regex match in inline styles
        content = content.replace(/,\s*background:\s*['"]var\(--accent-[a-z]+\)['"]/g, '');
        content = content.replace(/background:\s*['"]var\(--accent-[a-z]+\)['"],?\s*/g, '');

        content = content.replace(/,\s*color:\s*['"]#1a1a2e['"]/g, '');
        content = content.replace(/color:\s*['"]#1a1a2e['"],?\s*/g, '');

        content = content.replace(/,\s*background:\s*['"]var\(--card-bg\)['"]/g, '');
        content = content.replace(/background:\s*['"]var\(--card-bg\)['"],?\s*/g, '');

        // strip the 3px solid, etc if any was missed
        content = content.replace(/3px solid var\(--border-color\)/g, '1px solid var(--border-color)');
        content = content.replace(/4px solid var\(--border-color\)/g, '1px solid var(--border-color)');

        fs.writeFileSync(f, content);
    }
});
console.log('Cleaned inline JSX colors');
