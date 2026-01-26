// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.OCI_REGION = 'eu-frankfurt-1';
  process.env.OCI_COMPARTMENT_ID = 'ocid1.compartment.oc1..test';
});

afterAll(() => {
  // Clean up
  delete process.env.OCI_REGION;
  delete process.env.OCI_COMPARTMENT_ID;
});
