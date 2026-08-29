const fs = require('fs');
const filePath = require('path').join(__dirname, 'frontend/src/components/views/KanbanBoard.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// Update COLUMNS to include rail color
content = content.replace(
  /const COLUMNS: \{ status: IssueStatus; label: string; color: string \}\[\] = \[/,
  `const COLUMNS: { status: IssueStatus; label: string; color: string; rail: string }[] = [`
);

content = content.replace(/\{ status: 'OPEN', label: 'Open Backlog', color: 'border-blue-500\/40 text-blue-400' \},/,
  `{ status: 'OPEN', label: 'Open Backlog', color: 'border-blue-500/40 text-blue-400', rail: 'border-l-blue-500' },`
);
content = content.replace(/\{ status: 'TRIAGED', label: 'Triaged', color: 'border-primary\/40 text-primary' \},/,
  `{ status: 'TRIAGED', label: 'Triaged', color: 'border-primary/40 text-primary', rail: 'border-l-primary' },`
);
content = content.replace(/\{ status: 'IN_PROGRESS', label: 'In Progress', color: 'border-amber-500\/40 text-amber-400' \},/,
  `{ status: 'IN_PROGRESS', label: 'In Progress', color: 'border-amber-500/40 text-amber-400', rail: 'border-l-amber-500' },`
);
content = content.replace(/\{ status: 'IN_REVIEW', label: 'In Review', color: 'border-primary\/40 text-primary' \},/,
  `{ status: 'IN_REVIEW', label: 'In Review', color: 'border-primary/40 text-primary', rail: 'border-l-primary' },`
);
content = content.replace(/\{ status: 'RESOLVED', label: 'Resolved \(QA\)', color: 'border-emerald-500\/40 text-emerald-400' \},/,
  `{ status: 'RESOLVED', label: 'Resolved (QA)', color: 'border-emerald-500/40 text-emerald-400', rail: 'border-l-emerald-500' },`
);
content = content.replace(/\{ status: 'CLOSED', label: 'Closed', color: 'border-zinc-500\/40 text-zinc-400' \},/,
  `{ status: 'CLOSED', label: 'Closed', color: 'border-zinc-500/40 text-zinc-400', rail: 'border-l-zinc-500' },`
);

// Update card style
content = content.replace(
  /className="group p-3 rounded-lg border border-border\/60 bg-secondary\/30 hover:bg-secondary\/70 hover:border-primary\/50 transition-all cursor-pointer shadow-sm space-y-2\.5"/g,
  `className={\`group p-3 rounded-lg border-y border-r border-l-2 border-border/60 bg-[#151815] hover:bg-[#1D211D] transition-all cursor-pointer shadow-sm space-y-2.5 \${col.rail}\`}`
);

// Update issue ID color in card
content = content.replace(
  /className="font-mono text-\[11px\] font-bold text-primary group-hover:underline"/g,
  `className="font-mono text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors cursor-pointer"`
);

// Mute the component badge
content = content.replace(
  /<span className="text-primary font-medium">\{issue.component.name\}<\/span>/g,
  `<span className="text-muted-foreground group-hover:text-foreground transition-colors font-medium">{issue.component.name}</span>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated KanbanBoard.tsx');
