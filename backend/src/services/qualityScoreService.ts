export interface QualityCheckItem {
  id: string;
  label: string;
  passed: boolean;
  points: number;
  tip?: string;
}

export interface BugQualityScoreResult {
  score: number;
  rating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  checklist: QualityCheckItem[];
  recommendations: string[];
}

export class QualityScoreService {
  /**
   * Calculate deterministic, transparent Bug Quality Score (0 - 100)
   */
  static calculateScore(data: {
    title?: string;
    description?: string;
    repro_steps?: string;
    expected_behavior?: string;
    actual_behavior?: string;
    environment?: string;
    component_id?: string;
    version_id?: string;
  }): BugQualityScoreResult {
    const checklist: QualityCheckItem[] = [];
    const recommendations: string[] = [];

    const title = (data.title || '').trim();
    const description = (data.description || '').trim();
    const reproSteps = (data.repro_steps || '').trim();
    const expected = (data.expected_behavior || '').trim();
    const actual = (data.actual_behavior || '').trim();
    const env = (data.environment || '').trim();
    const hasComponent = Boolean(data.component_id && data.component_id.length > 0);
    const hasVersion = Boolean(data.version_id && data.version_id.length > 0);

    // 1. Title Quality (+15 pts)
    const isVagueTitle = /^(bug|error|broken|test|issue|fix|problem|not working)$/i.test(title);
    const hasGoodTitle = title.length >= 10 && !isVagueTitle;
    checklist.push({
      id: 'title',
      label: 'Clear & Descriptive Title',
      passed: hasGoodTitle,
      points: 15,
      tip: hasGoodTitle ? undefined : 'Provide a descriptive summary (e.g. "Checkout crashes when coupon expired")',
    });
    if (!hasGoodTitle) recommendations.push('Add an actionable summary title with specific defect symptoms.');

    // 2. Detailed Technical Description (+15 pts)
    const hasGoodDesc = description.length >= 25;
    checklist.push({
      id: 'description',
      label: 'Technical Context & Description',
      passed: hasGoodDesc,
      points: 15,
      tip: hasGoodDesc ? undefined : 'Describe the broader context, logs, or error symptoms in detail.',
    });
    if (!hasGoodDesc) recommendations.push('Include detailed background context or stack trace logs.');

    // 3. Reproduction Steps (+20 pts)
    const hasNumberedSteps = /\b(1\.|2\.|step\s*1)/i.test(reproSteps) || reproSteps.length >= 25;
    checklist.push({
      id: 'repro_steps',
      label: 'Numbered Reproduction Steps',
      passed: hasNumberedSteps,
      points: 20,
      tip: hasNumberedSteps ? undefined : 'Provide step-by-step sequence (1. Open page, 2. Click button, 3. Observe error).',
    });
    if (!hasNumberedSteps) recommendations.push('Add numbered reproduction steps (e.g. 1. Go to Cart, 2. Apply Coupon).');

    // 4. Expected Behavior (+10 pts)
    const hasExpected = expected.length >= 10;
    checklist.push({
      id: 'expected_behavior',
      label: 'Expected System Behavior',
      passed: hasExpected,
      points: 10,
      tip: hasExpected ? undefined : 'State what the system should have done under normal conditions.',
    });
    if (!hasExpected) recommendations.push('State expected behavior (e.g. "Coupon displays validation error").');

    // 5. Actual Behavior (+10 pts)
    const hasActual = actual.length >= 10;
    checklist.push({
      id: 'actual_behavior',
      label: 'Actual Observed Failure',
      passed: hasActual,
      points: 10,
      tip: hasActual ? undefined : 'State the actual failure, error code, or visual glitch observed.',
    });
    if (!hasActual) recommendations.push('State actual observed failure (e.g. "500 Internal Server Error").');

    // 6. Environment Diagnostics (+10 pts)
    const hasEnv = env.length >= 4;
    checklist.push({
      id: 'environment',
      label: 'Browser, OS & Runner Environment',
      passed: hasEnv,
      points: 10,
      tip: hasEnv ? undefined : 'Specify Chrome/Firefox, macOS/Windows, or CI runner details.',
    });
    if (!hasEnv) recommendations.push('Provide environment details (e.g. Chrome 128 / macOS 15.1).');

    // 7. Component Association (+10 pts)
    checklist.push({
      id: 'component',
      label: 'Subsystem Component Selected',
      passed: hasComponent,
      points: 10,
      tip: hasComponent ? undefined : 'Assign this defect to a subsystem component (e.g. Checkout & Cart).',
    });
    if (!hasComponent) recommendations.push('Select a target component to route this ticket to the right engineering team.');

    // 8. Target Release / Version (+10 pts)
    checklist.push({
      id: 'version',
      label: 'Target Release Version Tagged',
      passed: hasVersion,
      points: 10,
      tip: hasVersion ? undefined : 'Tag the affected release version (e.g. v2.4.0).',
    });
    if (!hasVersion) recommendations.push('Tag target release version for release readiness tracking.');

    // Calculate total score
    const totalScore = checklist.filter((item) => item.passed).reduce((sum, item) => sum + item.points, 0);

    let rating: BugQualityScoreResult['rating'] = 'POOR';
    if (totalScore >= 85) rating = 'EXCELLENT';
    else if (totalScore >= 70) rating = 'GOOD';
    else if (totalScore >= 50) rating = 'FAIR';

    return {
      score: totalScore,
      rating,
      checklist,
      recommendations,
    };
  }
}
