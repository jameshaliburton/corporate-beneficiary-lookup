/**
 * Global test setup
 * Runs once before all tests
 */

export default async function globalSetup() {
  // Set up global test environment
  process.env.NODE_ENV = 'test';
  
  // Set up test database or other global resources if needed
  console.log('🧪 Global test setup completed');
}
