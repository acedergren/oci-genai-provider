import { getConnection, StateRepository } from '@oci-provider-examples/agent-state';

// Singleton repository instance for server-side use
let repository: StateRepository | null = null;

export function getRepository(): StateRepository {
  if (!repository) {
    const db = getConnection();
    repository = new StateRepository(db);
  }
  return repository;
}
