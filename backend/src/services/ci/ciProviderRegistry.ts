import { CIProvider } from './ciProvider';
import { GitHubActionsProvider } from './githubActionsProvider';
import { CIProviderType } from '../../types/ci';

class CIProviderRegistry {
  private providers: Map<CIProviderType, CIProvider> = new Map();

  constructor() {
    this.register(new GitHubActionsProvider());
  }

  register(provider: CIProvider) {
    this.providers.set(provider.type, provider);
  }

  get(type: CIProviderType = 'github_actions'): CIProvider {
    const provider = this.providers.get(type) || this.providers.get('github_actions');
    if (!provider) {
      throw new Error(`CI provider '${type}' not found`);
    }
    return provider;
  }
}

export const ciRegistry = new CIProviderRegistry();
