const fs = require('fs');
const filePath = require('path').join(__dirname, 'frontend/src/pages/IssuesPage.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// Update table density
content = content.replace(/py-3 px-4/g, 'py-1.5 px-3');

// Remove hover background on table rows to a more subtle one
content = content.replace(/hover:bg-secondary\/40/g, 'hover:bg-secondary/20');

// Make the text slightly smaller or more compact if needed
content = content.replace(/className="w-full text-left text-xs border-collapse"/g, 'className="w-full text-left text-[11px] border-collapse"');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated IssuesPage.tsx padding');
