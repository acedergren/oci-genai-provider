export class IdentityClient {
  region: unknown;
  endpoint?: string;

  constructor(_params: { authenticationDetailsProvider: unknown }) {}

  listCompartments(_request: unknown): Promise<unknown> {
    return Promise.resolve({ items: [] });
  }

  getUser(_request: unknown): Promise<unknown> {
    return Promise.resolve({ user: {} });
  }

  getTenancy(_request: unknown): Promise<unknown> {
    return Promise.resolve({ tenancy: {} });
  }
}

export const models = {
  Compartment: {
    LifecycleState: {
      Active: 'ACTIVE',
    },
  },
};
