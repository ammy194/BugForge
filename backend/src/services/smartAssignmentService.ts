import { ProjectService } from './projectService';
import { IssueService } from './issueService';
import { IssuePriority } from '../types/issue';
import { AppError } from '../utils/appError';

export interface AssigneeCandidate {
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
  score: number;
  reasons: string[];
  open_issues: number;
  open_critical_issues: number;
}

export interface SmartAssignmentResult {
  suggested_user_id: string;
  suggested_name: string;
  suggested_email: string;
  avatar_url?: string;
  confidence_score: number;
  reasons: string[];
  candidates: AssigneeCandidate[];
}

export class SmartAssignmentService {
  /**
   * Deterministic smart assignment recommendation based on component ownership,
   * historical resolution expertise, and active workload balancing.
   */
  static async suggestAssignee(data: {
    project_id: string;
    component_id?: string;
    title: string;
    description?: string;
    priority?: IssuePriority;
  }): Promise<SmartAssignmentResult> {
    const { project_id, component_id, title, description = '', priority } = data;

    const project = await ProjectService.getProject(project_id);
    if (!project) throw AppError.notFound(`Project '${project_id}' not found`);

    const members = await ProjectService.getMembers(project.id);
    const components = await ProjectService.getComponents(project.id);
    const { issues } = await IssueService.listIssues({ project_id: project.id, limit: 200 });

    const targetComponent = components.find((c) => c.id === component_id);
    const text = `${title} ${description}`.toLowerCase();

    const candidates: AssigneeCandidate[] = [];

    for (const member of members) {
      if (!member.user) continue;

      const userIssues = issues.filter((i) => i.assignee_id === member.user_id);
      const openIssues = userIssues.filter((i) => !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(i.status));
      const openCritical = openIssues.filter((i) => i.priority === 'P0_CRITICAL' || i.priority === 'P1_HIGH');
      const resolvedIssues = userIssues.filter((i) => ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(i.status));

      let score = 0;
      const reasons: string[] = [];

      // 1. Component Ownership (+40 pts)
      if (targetComponent) {
        if (targetComponent.default_assignee_id === member.user_id) {
          score += 40;
          reasons.push(`Designated owner of ${targetComponent.name} component`);
        } else {
          const resolvedInComp = resolvedIssues.filter((i) => i.component_id === targetComponent.id).length;
          if (resolvedInComp > 0) {
            score += Math.min(25, resolvedInComp * 8);
            reasons.push(`Resolved ${resolvedInComp} previous defects in ${targetComponent.name}`);
          }
        }
      }

      // 2. Keyword & Domain Expertise (+25 pts)
      const domainKeywords = ['checkout', 'payment', 'cart', 'coupon', 'auth', 'database', 'api', 'upload', 'stripe'];
      const matchedDomain = domainKeywords.find((kw) => text.includes(kw));

      if (matchedDomain) {
        const resolvedDomainBugs = resolvedIssues.filter(
          (i) => (i.title + ' ' + (i.description || '')).toLowerCase().includes(matchedDomain)
        ).length;

        if (resolvedDomainBugs > 0) {
          score += Math.min(25, resolvedDomainBugs * 7);
          reasons.push(`Has domain experience with ${matchedDomain} subsystems (${resolvedDomainBugs} resolved)`);
        }
      }

      // 3. Workload Balancing (+20 pts)
      if (openCritical.length === 0) {
        score += 20;
        reasons.push(`Optimal active capacity (0 open critical/P1 issues)`);
      } else if (openCritical.length <= 2) {
        score += 10;
        reasons.push(`Currently handling ${openCritical.length} P1 issues`);
      } else {
        score -= 10; // Heavy workload deduction
        reasons.push(`Heavy workload warning (${openCritical.length} critical issues in progress)`);
      }

      // 4. Role Fit (+15 pts)
      if (member.role === 'DEVELOPER') {
        score += 15;
      } else if (member.role === 'PROJECT_MANAGER' || member.role === 'ADMIN') {
        score += 8;
      }

      // Fallback base reason if none matched
      if (reasons.length === 0) {
        reasons.push(`Active project engineer (${member.role})`);
      }

      candidates.push({
        user_id: member.user_id,
        name: member.user.full_name,
        email: member.user.email,
        avatar_url: member.user.avatar_url,
        role: member.role,
        score: Math.max(10, score),
        reasons,
        open_issues: openIssues.length,
        open_critical_issues: openCritical.length,
      });
    }

    // Sort by highest suitability score
    candidates.sort((a, b) => b.score - a.score);

    // AI-powered Smart Assignment using Grok
    if (candidates.length > 0) {
      const { GrokProvider } = await import('./ai/grokProvider');
      if (GrokProvider.isConfigured()) {
        try {
          const prompt = `Analyze this issue and select the most suitable developer from the candidates:
Title: "${title}"
Description: "${description}"
Component: "${targetComponent?.name || 'None'}"
Priority: "${priority || 'None'}"

Candidates:
${JSON.stringify(
  candidates.map((c) => ({
    user_id: c.user_id,
    name: c.name,
    role: c.role,
    open_issues: c.open_issues,
    open_critical_issues: c.open_critical_issues,
    expertise: c.reasons.join(', '),
  })),
  null,
  2
)}

Return JSON strictly matching this schema:
{
  "suggested_user_id": string,
  "reasons": string[],
  "confidence_score": number (0-100)
}`;
          const raw = await GrokProvider.complete(
            prompt,
            'You are an expert developer triage AI for BugForge issue tracking platform. Output strictly valid JSON.'
          );
          if (raw) {
            const parsed = JSON.parse(raw);
            const aiTop = candidates.find((c) => c.user_id === parsed.suggested_user_id);
            if (aiTop) {
              return {
                suggested_user_id: aiTop.user_id,
                suggested_name: aiTop.name,
                suggested_email: aiTop.email,
                avatar_url: aiTop.avatar_url,
                confidence_score: parsed.confidence_score || 90,
                reasons: parsed.reasons || aiTop.reasons,
                candidates,
              };
            }
          }
        } catch (err: any) {
          // Fallback to heuristic on error
          console.warn(`Grok assignment failed, executing heuristic fallback: ${err.message}`);
        }
      }
    }

    const top = candidates[0] || {
      user_id: members[0]?.user_id || 'unassigned',
      name: members[0]?.user?.full_name || 'Lead Engineer',
      email: members[0]?.user?.email || 'dev@bugforge.dev',
      avatar_url: members[0]?.user?.avatar_url,
      role: 'DEVELOPER',
      score: 75,
      reasons: ['Project development team member'],
      open_issues: 1,
      open_critical_issues: 0,
    };

    const confidenceScore = Math.min(96, Math.max(65, top.score));

    return {
      suggested_user_id: top.user_id,
      suggested_name: top.name,
      suggested_email: top.email,
      avatar_url: top.avatar_url,
      confidence_score: confidenceScore,
      reasons: top.reasons,
      candidates,
    };
  }
}
