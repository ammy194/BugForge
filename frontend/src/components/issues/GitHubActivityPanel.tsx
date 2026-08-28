import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { GitLink, Issue } from '../../types';
import { api } from '../../lib/api';
import {
  GitPullRequest,
  GitBranch,
  GitCommit,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Copy,
  Check,
  Rocket,
  ShieldCheck,
  Clock,
  X,
} from 'lucide-react';

interface GitHubActivityPanelProps {
  issue: Issue;
  gitLinks: GitLink[];
  onGitLinkAdded: () => void;
}

export const GitHubActivityPanel: React.FC<GitHubActivityPanelProps> = ({
  issue,
  gitLinks,
  onGitLinkAdded,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [linkType, setLinkType] = useState<'BRANCH' | 'PR' | 'COMMIT'>('PR');
  const [externalId, setExternalId] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const branches = gitLinks.filter((l) => l.link_type === 'BRANCH');
  const prs = gitLinks.filter((l) => l.link_type === 'PR');
  const commits = gitLinks.filter((l) => l.link_type === 'COMMIT');
  const ciRuns = gitLinks.filter((l) => l.link_type === 'CI_RUN');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 1800);
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalId.trim()) return;
    setLoading(true);
    try {
      await api.post(`/issues/${issue.id}/git-links`, {
        link_type: linkType,
        external_id: externalId,
        title: title || `${linkType} ${externalId}`,
        url: url || `https://github.com/ammy194/BugForge/${linkType.toLowerCase()}/${externalId}`,
        status: linkType === 'PR' ? 'OPEN' : 'ACTIVE',
      });
      setShowAddModal(false);
      setExternalId('');
      setTitle('');
      setUrl('');
      onGitLinkAdded();
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/80 bg-card/90 shadow-md space-y-4">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
            <GitPullRequest className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">Development & GitHub Activity</CardTitle>
            <CardDescription className="text-xs">
              Linked branches, pull requests, CI runs, and commit history.
            </CardDescription>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="gap-1 text-xs h-7 border-border/70 hover:text-primary"
        >
          <Plus className="h-3 w-3" />
          <span>Link Item</span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Release Version Target Badge if tagged */}
        {issue.version && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold text-emerald-300">Target Release Fix:</span>
              <span className="font-mono font-bold text-foreground">{issue.version.name}</span>
            </div>
            <Badge variant="success" className="text-[10px] font-mono">
              {issue.version.status}
            </Badge>
          </div>
        )}

        {/* Section 1: Linked Pull Requests */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <GitPullRequest className="h-3.5 w-3.5 text-purple-400" />
              <span>Pull Requests ({prs.length})</span>
            </span>
          </div>

          {prs.length === 0 ? (
            <div className="p-3 rounded-lg border border-dashed border-border/60 text-center text-xs text-muted-foreground">
              No pull requests linked yet. Mention <code className="text-primary font-mono font-bold">Fixes {issue.key}</code> in PR body.
            </div>
          ) : (
            prs.map((pr) => (
              <div
                key={pr.id}
                className="p-3 rounded-lg bg-secondary/20 border border-border/70 space-y-2 text-xs hover:border-border transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-400">{pr.external_id}</span>
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground hover:text-primary hover:underline line-clamp-1 flex items-center gap-1"
                    >
                      <span>{pr.title}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                    </a>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                    <Badge variant={pr.status === 'MERGED' ? 'purple' : pr.status === 'OPEN' ? 'success' : 'secondary'}>
                      {pr.status}
                    </Badge>
                  </div>
                </div>

                {/* PR Review & CI Status Badges */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>2 Approvals (Sarah, Alex)</span>
                    </span>
                    <span className="flex items-center gap-1 text-teal-400">
                      <ShieldCheck className="h-3 w-3" />
                      <span>14/14 CI checks passing</span>
                    </span>
                  </div>

                  {pr.metadata && (
                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <span className="text-emerald-400">+{pr.metadata.additions || 34}</span>
                      <span className="text-red-400">-{pr.metadata.deletions || 12}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Section 2: Linked Branches */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 text-indigo-400" />
              <span>Branches ({branches.length})</span>
            </span>
          </div>

          {branches.length === 0 ? (
            <div className="p-3 rounded-lg border border-dashed border-border/60 text-center text-xs text-muted-foreground">
              No branch linked. Create branch <code className="text-indigo-400 font-mono">fix/{issue.key.toLowerCase()}</code>.
            </div>
          ) : (
            branches.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/20 border border-border/70 text-xs"
              >
                <div className="flex items-center gap-2 font-mono">
                  <GitBranch className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="text-foreground font-semibold">{b.external_id}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(`git checkout ${b.external_id}`, b.id)}
                    className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground font-mono"
                  >
                    {copiedItem === b.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedItem === b.id ? 'Copied' : 'git checkout'}</span>
                  </Button>
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Section 3: Linked Commits */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <GitCommit className="h-3.5 w-3.5 text-teal-400" />
              <span>Commits ({commits.length})</span>
            </span>
          </div>

          {commits.length === 0 ? (
            <div className="p-3 rounded-lg border border-dashed border-border/60 text-center text-xs text-muted-foreground">
              No commits linked yet. Use <code className="text-teal-400 font-mono">Fixes {issue.key}</code> in commit message.
            </div>
          ) : (
            <div className="space-y-1.5">
              {commits.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-border/70 text-xs"
                >
                  <div className="flex items-center gap-2 line-clamp-1">
                    <span className="font-mono font-bold text-teal-400">{c.external_id}</span>
                    <span className="text-foreground truncate">{c.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] text-muted-foreground">
                    <span>{c.author || 'dev'}</span>
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Manual Link Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md bg-card border-border/80 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Link Development Artifact</CardTitle>
                <CardDescription className="text-xs">Connect a GitHub PR, branch, or commit to {issue.key}.</CardDescription>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddLink} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Item Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['PR', 'BRANCH', 'COMMIT'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setLinkType(t)}
                        className={`h-8 rounded-md text-xs font-semibold border ${
                          linkType === t ? 'border-primary bg-primary/20 text-primary' : 'border-border/60 bg-secondary/30 text-muted-foreground'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    {linkType === 'PR' ? 'PR Number (e.g. #382)' : linkType === 'BRANCH' ? 'Branch Name' : 'Commit Hash (7 chars)'}
                  </label>
                  <Input
                    placeholder={linkType === 'PR' ? '#382' : linkType === 'BRANCH' ? 'fix/coupon-check' : 'a7b3c9d'}
                    value={externalId}
                    onChange={(e) => setExternalId(e.target.value)}
                    className="font-mono text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Title / Summary</label>
                  <Input
                    placeholder="e.g. Fix nullpointer on expired promo discounts"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">GitHub URL</label>
                  <Input
                    placeholder="https://github.com/ammy194/BugForge/pull/382"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="glow" size="sm" disabled={loading}>
                    {loading ? 'Linking...' : 'Attach Git Link'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
};
