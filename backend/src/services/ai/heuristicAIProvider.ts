import { AITriageResult, MissingInfoItem } from '../../types/ai';
import { IssuePriority, IssueSeverity } from '../../types/issue';
import { Component } from '../../types/project';

export class HeuristicAIProvider {
  /**
   * Deterministic local fallback triage analysis
   */
  static triage(title: string, description: string, components: Component[]): AITriageResult {
    const text = `${title} ${description}`.toLowerCase();

    // 1. Severity & Priority Classification
    let severity: IssueSeverity = 'MAJOR';
    let priority: IssuePriority = 'P2_MEDIUM';

    if (
      text.includes('crash') ||
      text.includes('data loss') ||
      text.includes('vulnerability') ||
      text.includes('outage') ||
      text.includes('deadlock') ||
      text.includes('500 internal server')
    ) {
      severity = 'CRITICAL';
      priority = 'P0_CRITICAL';
    } else if (
      text.includes('cannot') ||
      text.includes('blocked') ||
      text.includes('fails') ||
      text.includes('error') ||
      text.includes('exception') ||
      text.includes('timeout')
    ) {
      severity = 'MAJOR';
      priority = 'P1_HIGH';
    } else if (text.includes('slow') || text.includes('delay') || text.includes('performance')) {
      severity = 'MAJOR';
      priority = 'P2_MEDIUM';
    } else if (text.includes('typo') || text.includes('alignment') || text.includes('color') || text.includes('css')) {
      severity = 'TRIVIAL';
      priority = 'P3_LOW';
    }

    // 2. Component Matching
    let matchedComponent: Component | undefined;
    if (components.length > 0) {
      matchedComponent = components.find((c) => {
        const nameWords = c.name.toLowerCase().split(/[\s&/]+/);
        return nameWords.some((w) => w.length > 2 && text.includes(w));
      });
    }

    // 3. Smart Label Extraction
    const candidateLabels = [
      'crash',
      'upload',
      'checkout',
      'payment',
      'auth',
      'security',
      'performance',
      'timeout',
      'regression',
      'api',
      'ui',
      'mobile',
      'database',
    ];

    const suggestedLabels: string[] = candidateLabels.filter((l) => text.includes(l));
    if (suggestedLabels.length === 0) {
      suggestedLabels.push('defect', 'triage-ai');
    }

    // 4. Missing Information Detection
    const missingInfo: MissingInfoItem[] = [];

    if (!text.includes('chrome') && !text.includes('firefox') && !text.includes('safari') && !text.includes('browser')) {
      missingInfo.push({
        field: 'browser',
        label: 'Browser / Client Version Missing',
        reason: 'Specifying the browser (Chrome, Firefox, Safari) helps isolate engine-specific layout and JS bugs.',
      });
    }

    if (!text.includes('macos') && !text.includes('windows') && !text.includes('linux') && !text.includes('ios') && !text.includes('android')) {
      missingInfo.push({
        field: 'os',
        label: 'Operating System Environment Missing',
        reason: 'OS environment details help reproduce platform-specific file system and rendering glitches.',
      });
    }

    if (text.includes('upload') || text.includes('image') || text.includes('file')) {
      if (!text.includes('mb') && !text.includes('kb') && !text.includes('size')) {
        missingInfo.push({
          field: 'file_size',
          label: 'Exact File Size / Payload Specification Missing',
          reason: 'Mentioning the exact image/file size (e.g. >20MB) is needed to reproduce memory and buffer crashes.',
        });
      }
    }

    if (!text.includes('1.') && !text.includes('step') && description.length < 80) {
      missingInfo.push({
        field: 'repro_steps',
        label: 'Numbered Reproduction Sequence Missing',
        reason: 'Step-by-step numbered steps accelerate engineering root cause discovery.',
      });
    }

    return {
      suggested_severity: severity,
      suggested_priority: priority,
      suggested_component_id: matchedComponent?.id,
      suggested_component_name: matchedComponent?.name,
      suggested_labels: suggestedLabels,
      missing_information: missingInfo,
      confidence_score: 88,
      triage_summary: `Classified as ${priority} (${severity}) based on detected crash/impact terms. Suggested component: ${matchedComponent?.name || 'General'}.`,
      ai_provider: 'Grok / Heuristic Engine (Local Fallback)',
    };
  }
}
