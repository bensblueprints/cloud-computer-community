/**
 * Go High Level (GHL) Integration Tests
 *
 * Tests GHL sub-account provisioning, suspension, and reactivation
 * for all CloudCode plans (SOLO, TEAM, ARMY)
 *
 * Run: node tests/ghl-integration.test.js
 */

require('dotenv').config();
const ghlService = require('../src/services/GHLService');

const TEST_PLANS = ['SOLO', 'TEAM', 'ARMY'];
const createdLocations = [];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  const icon = passed ? '✓' : '✗';
  const color = passed ? 'green' : 'red';
  log(`  ${icon} ${name}${details ? ` - ${details}` : ''}`, color);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testGHLConfiguration() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST: GHL Configuration', 'bold');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

  const isConfigured = ghlService.isConfigured();
  logTest('GHL API Key configured', isConfigured, isConfigured ? 'API key present' : 'GHL_API_KEY missing!');

  if (!isConfigured) {
    log('\n⚠️  GHL_API_KEY not set. Cannot run integration tests.', 'yellow');
    process.exit(1);
  }

  return isConfigured;
}

async function testCreateSubAccount(plan) {
  log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
  log(`TEST: Create Sub-Account for ${plan} Plan`, 'bold');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

  const testEmail = `test-${plan.toLowerCase()}-${Date.now()}@cloudcode.test`;
  const testName = `CloudCode Test - ${plan} Plan`;

  log(`  Creating sub-account for: ${testEmail}`, 'yellow');

  const result = await ghlService.createSubAccount({
    name: testName,
    email: testEmail,
    phone: '+1234567890',
    address: '123 Test Street',
    city: 'Test City',
    state: 'CA',
    country: 'US',
    postalCode: '90210',
    timezone: 'America/New_York'
  });

  logTest('API call succeeded', result.success, result.success ? `Location ID: ${result.locationId}` : result.error);

  if (result.success) {
    logTest('Location ID returned', !!result.locationId, result.locationId);
    createdLocations.push({
      plan,
      locationId: result.locationId,
      email: testEmail
    });

    // Verify we can fetch the sub-account
    await sleep(1000); // Wait for GHL to process
    const subAccount = await ghlService.getSubAccount(result.locationId);
    logTest('Sub-account retrievable', !!subAccount, subAccount ? 'Retrieved successfully' : 'Failed to retrieve');
  }

  return result;
}

async function testSuspendSubAccount(locationId, plan) {
  log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
  log(`TEST: Suspend Sub-Account (${plan})`, 'bold');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

  log(`  Suspending location: ${locationId}`, 'yellow');

  const result = await ghlService.suspendSubAccount(locationId);
  logTest('Suspend API call succeeded', result.success, result.success ? 'Account suspended' : result.error);

  return result;
}

async function testReactivateSubAccount(locationId, plan) {
  log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
  log(`TEST: Reactivate Sub-Account (${plan})`, 'bold');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

  log(`  Reactivating location: ${locationId}`, 'yellow');

  const result = await ghlService.reactivateSubAccount(locationId);
  logTest('Reactivate API call succeeded', result.success, result.success ? 'Account reactivated' : result.error);

  return result;
}

async function testCreateUser(locationId, plan) {
  log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
  log(`TEST: Create User in Sub-Account (${plan})`, 'bold');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

  const testUser = {
    firstName: 'Test',
    lastName: `User-${plan}`,
    email: `testuser-${plan.toLowerCase()}-${Date.now()}@cloudcode.test`,
    role: 'user'
  };

  log(`  Creating user: ${testUser.email}`, 'yellow');

  const result = await ghlService.createUser(locationId, testUser);
  logTest('Create user API call succeeded', result.success, result.success ? `User ID: ${result.userId}` : result.error);

  return result;
}

async function testDeleteSubAccount(locationId, plan) {
  log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
  log(`TEST: Delete Sub-Account (${plan}) - Cleanup`, 'bold');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

  log(`  Deleting location: ${locationId}`, 'yellow');

  const result = await ghlService.deleteSubAccount(locationId);
  logTest('Delete API call succeeded', result.success, result.success ? 'Account deleted' : result.error);

  return result;
}

async function runFullTestSuite() {
  log('\n╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     GO HIGH LEVEL INTEGRATION TEST SUITE                     ║', 'bold');
  log('║     Testing: Provisioning, Suspension, Reactivation          ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Configuration
  const configOk = await testGHLConfiguration();
  if (configOk) {
    results.passed++;
  } else {
    results.failed++;
    return results;
  }

  // Test 2-4: Create sub-accounts for each plan
  for (const plan of TEST_PLANS) {
    const createResult = await testCreateSubAccount(plan);
    if (createResult.success) {
      results.passed++;
      results.tests.push({ test: `Create ${plan}`, passed: true, locationId: createResult.locationId });
    } else {
      results.failed++;
      results.tests.push({ test: `Create ${plan}`, passed: false, error: createResult.error });
    }
    await sleep(500); // Rate limiting
  }

  // Test 5-7: Create users in each sub-account (TEAM and ARMY would have multiple)
  for (const location of createdLocations) {
    const userResult = await testCreateUser(location.locationId, location.plan);
    if (userResult.success) {
      results.passed++;
      results.tests.push({ test: `Create User ${location.plan}`, passed: true });
    } else {
      results.failed++;
      results.tests.push({ test: `Create User ${location.plan}`, passed: false, error: userResult.error });
    }
    await sleep(500);
  }

  // Test 8-10: Suspend each sub-account
  for (const location of createdLocations) {
    const suspendResult = await testSuspendSubAccount(location.locationId, location.plan);
    if (suspendResult.success) {
      results.passed++;
      results.tests.push({ test: `Suspend ${location.plan}`, passed: true });
    } else {
      results.failed++;
      results.tests.push({ test: `Suspend ${location.plan}`, passed: false, error: suspendResult.error });
    }
    await sleep(500);
  }

  // Test 11-13: Reactivate each sub-account
  for (const location of createdLocations) {
    const reactivateResult = await testReactivateSubAccount(location.locationId, location.plan);
    if (reactivateResult.success) {
      results.passed++;
      results.tests.push({ test: `Reactivate ${location.plan}`, passed: true });
    } else {
      results.failed++;
      results.tests.push({ test: `Reactivate ${location.plan}`, passed: false, error: reactivateResult.error });
    }
    await sleep(500);
  }

  // Cleanup: Delete all test sub-accounts
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'yellow');
  log('CLEANUP: Deleting test sub-accounts', 'bold');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'yellow');

  for (const location of createdLocations) {
    await testDeleteSubAccount(location.locationId, location.plan);
    await sleep(500);
  }

  return results;
}

async function main() {
  const startTime = Date.now();

  try {
    const results = await runFullTestSuite();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    log('\n╔══════════════════════════════════════════════════════════════╗', 'cyan');
    log('║                    TEST RESULTS SUMMARY                       ║', 'bold');
    log('╚══════════════════════════════════════════════════════════════╝', 'cyan');

    log(`\n  Total Tests: ${results.passed + results.failed}`, 'bold');
    log(`  ✓ Passed: ${results.passed}`, 'green');
    log(`  ✗ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
    log(`  Duration: ${duration}s\n`, 'yellow');

    if (results.failed > 0) {
      log('Failed Tests:', 'red');
      results.tests
        .filter(t => !t.passed)
        .forEach(t => log(`  - ${t.test}: ${t.error}`, 'red'));
    }

    log('\nTest Locations Created:', 'cyan');
    createdLocations.forEach(loc => {
      log(`  - ${loc.plan}: ${loc.locationId} (${loc.email})`, 'yellow');
    });

    if (results.failed === 0) {
      log('\n✅ ALL TESTS PASSED! GHL integration is working correctly.\n', 'green');
      process.exit(0);
    } else {
      log('\n❌ SOME TESTS FAILED. Check the errors above.\n', 'red');
      process.exit(1);
    }

  } catch (error) {
    log(`\n❌ Test suite crashed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the tests
main();
