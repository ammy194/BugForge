import { CIProviderType, NormalizedCIFailure } from '../../types/ci';
import { CreateIssueDto } from '../../types/issue';

export interface CIProvider {
  type: CIProviderType;
  displayName: string;

  /**
   * Normalize vendor-specific payload into a standard NormalizedCIFailure
   */
  normalize(rawPayload: any): NormalizedCIFailure;

  /**
   * Format normalized failure into a clean, structured defect draft
   */
  formatIssueDraft(failure: NormalizedCIFailure, projectId: string): CreateIssueDto;
}
