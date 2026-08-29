const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const frontendSrc = path.join(__dirname, 'frontend/src');

walkDir(frontendSrc, (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // The glow button gradient
  content = content.replace(/bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500\/25 hover:shadow-indigo-500\/40/g, 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40');
  
  // CreateIssueModal gradient
  content = content.replace(/bg-gradient-to-br from-indigo-500 via-primary to-pink-500/g, 'bg-primary');
  content = content.replace(/bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500/g, 'bg-primary');
  content = content.replace(/shadow-indigo-500\/25/g, 'shadow-primary/25');

  // AITriageInspector gradient
  content = content.replace(/from-purple-950\/30/g, 'from-primary/10');
  
  // BugQualityMeter gradients
  content = content.replace(/from-indigo-500 to-purple-400/g, 'from-primary/80 to-primary');
  content = content.replace(/from-red-500 to-pink-500/g, 'from-red-500 to-red-400');

  // Sidebar text gradient
  content = content.replace(/from-white via-slate-200 to-indigo-200/g, 'from-white via-slate-200 to-primary/50');
  
  // Login / Register blur backgrounds
  content = content.replace(/bg-indigo-500\/10/g, 'bg-primary/10');

  // Text indigo
  content = content.replace(/text-indigo-400/g, 'text-primary');
  content = content.replace(/text-indigo-300/g, 'text-primary');
  content = content.replace(/text-indigo-200/g, 'text-primary');

  // Background indigo
  content = content.replace(/bg-indigo-500\/20/g, 'bg-primary/20');
  content = content.replace(/bg-indigo-500\/10/g, 'bg-primary/10');
  content = content.replace(/bg-indigo-500\/5/g, 'bg-primary/5');
  content = content.replace(/bg-indigo-500/g, 'bg-primary');
  content = content.replace(/bg-indigo-600/g, 'bg-primary text-primary-foreground');
  content = content.replace(/hover:bg-indigo-500/g, 'hover:bg-primary/90');
  content = content.replace(/hover:bg-indigo-500\/20/g, 'hover:bg-primary/20');
  
  // Border indigo
  content = content.replace(/border-indigo-500\/40/g, 'border-primary/40');
  content = content.replace(/border-indigo-500\/30/g, 'border-primary/30');
  content = content.replace(/border-indigo-500\/20/g, 'border-primary/20');
  content = content.replace(/border-indigo-500/g, 'border-primary');

  // Other remaining explicit purple stuff
  content = content.replace(/ring-purple-400/g, 'ring-primary');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
});
