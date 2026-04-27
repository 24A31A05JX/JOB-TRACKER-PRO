const fs = require('fs');
let file = fs.readFileSync('src/app/(main)/interviews/page.tsx', 'utf-8');
file = file.replace(/\\`/g, '`');
fs.writeFileSync('src/app/(main)/interviews/page.tsx', file);
