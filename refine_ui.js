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

  // 1. Mute Issue IDs
  // Look for patterns like `<span className="font-mono font-bold text-primary text-xs">{item.key}</span>`
  content = content.replace(/className="([^"]*)text-primary([^"]*)"\>(\{item\.key\}|\{issue\.key\}|\{key\})/g, 'className="$1text-muted-foreground hover:text-primary transition-colors cursor-pointer$2"\>$3');

  // 2. Triage Ticket Button usage
  // The button has variant="glow" or "default" maybe, we need to find the Button wrapping Triage Ticket
  // This is tricky with regex, let's just do a string replace on DashboardPage and IssuesPage
  if (filePath.endsWith('DashboardPage.tsx') || filePath.endsWith('IssuesPage.tsx')) {
    content = content.replace(/variant="glow"([^>]*>\s*<span(?:[^>]*)>Triage Ticket<\/span>)/g, 'variant="action"$1');
    content = content.replace(/variant="default"([^>]*>\s*<span(?:[^>]*)>Triage Ticket<\/span>)/g, 'variant="action"$1');
  }

  // 3. Metric cards
  // Remove large lime background washes. e.g. bg-primary/5, bg-primary/10 from card containers.
  // In DashboardPage and AnalyticsPage:
  if (filePath.endsWith('DashboardPage.tsx') || filePath.endsWith('AnalyticsPage.tsx') || filePath.endsWith('ReleasesPage.tsx')) {
    content = content.replace(/bg-gradient-to-br from-primary\/10 via-secondary\/30 to-black\/40/g, 'bg-card border-border');
    content = content.replace(/bg-gradient-to-r from-card via-secondary\/20 to-primary\/10/g, 'bg-card border-border');
  }

  // 4. AI Indicators
  // We replaced purple-950/20 with primary/10. Let's make secondary AI indicators emerald.
  // In AITriageInspector, GrokAIEngine, SmartAssignmentCard
  if (filePath.includes('AITriageInspector') || filePath.includes('GrokAIEngine') || filePath.includes('SmartAssignmentCard')) {
    content = content.replace(/bg-primary\/10/g, 'bg-emerald-500/10');
    content = content.replace(/bg-primary\/20/g, 'bg-emerald-500/10');
    content = content.replace(/text-primary/g, 'text-emerald-400');
    content = content.replace(/border-primary\/30/g, 'border-emerald-500/20');
    content = content.replace(/border-primary\/40/g, 'border-emerald-500/20');
  }

  // 5. Tabs
  // Sidebar items. Currently active item might be fully colored.
  if (filePath.endsWith('Sidebar.tsx')) {
    content = content.replace(/bg-primary text-primary-foreground/g, 'bg-secondary/50 text-primary border-l-2 border-primary');
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
});
