const fs = require('fs');
const file = 'c:\\Users\\amkal\\OneDrive\\Desktop\\Provenance-main\\lib\\scanners\\asoScanner.js';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("? 'passed' :")) {
        const parts = lines[i].split("? 'passed' :");
        lines[i] = '    ' + parts[1].trim();
    }
}

fs.writeFileSync('c:\\Users\\amkal\\OneDrive\\Desktop\\Provenance-main\\lib\\scanners\\asoScanner_fixed.js', lines.join('\n'));
console.log('Fixed asoScanner.js');
