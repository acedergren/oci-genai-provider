export class ObjectStorageClient {
  region: unknown;
  endpoint?: string;

  constructor(_params: { authenticationDetailsProvider: unknown }) {}

  putObject(_request: unknown): Promise<unknown> {
    return Promise.resolve({});
  }

  getObject(_request: unknown): Promise<unknown> {
    return Promise.resolve({});
  }

  deleteObject(_request: unknown): Promise<unknown> {
    return Promise.resolve({});
  }

  getNamespace(_request: unknown): Promise<unknown> {
    return Promise.resolve({ value: 'mock-namespace' });
  }
}
