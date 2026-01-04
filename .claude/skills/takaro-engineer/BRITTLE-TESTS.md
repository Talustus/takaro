# Investigating Brittle Tests

Guide for identifying and fixing flaky/brittle tests in the Takaro test suite.

## Investigation Workflow

### 1. Get CI Failure Logs

```bash
# From a GitHub run URL, extract the run ID
gh run view <RUN_ID> --repo gettakaro/takaro --log-failed 2>&1 > /tmp/ci-logs.txt

# Find which tests failed
grep -E "✖|FAIL|Error" /tmp/ci-logs.txt | head -20

# Get context around a specific failing test
grep -B 10 -A 20 "test name here" /tmp/ci-logs.txt
```

### 2. Identify the Failing Test

Look for patterns in CI logs:
- `✖ <test name>` - Failed test marker
- `SNAPSHOT DIFFERENCE` - Snapshot mismatch details
- `Domain ID: <id>` - Can grep docker logs with this ID

### 3. Reproduce Locally

```bash
# Run the test once
docker compose exec takaro npm run test:file <path/to/test.ts>

# Run multiple times to catch intermittent failures (5-10 runs)
for i in {1..5}; do
  echo "=== Run $i ==="
  docker compose exec takaro npm run test:file <path/to/test.ts> || break
done
```

### 4. Analyze Root Cause

Check service logs during failure:
```bash
# API logs
docker compose logs --tail=100 takaro | grep -i "error\|warn"

# Database logs
docker compose logs --tail=100 postgresql | grep -E "lock|constraint|connection"

# Redis logs
docker compose logs --tail=100 redis | grep -i "error"

# Use domain ID from test failure
docker compose logs | grep <domain-id>
```

### 5. Implement Fix

Apply the appropriate fix pattern (see Common Patterns below).

### 6. Verify Fix

```bash
# Run 10+ times to confirm stability
for i in {1..10}; do
  echo "=== Run $i ==="
  docker compose exec takaro npm run test:file <path/to/test.ts> || exit 1
done
echo "All runs passed!"
```

---

## Common Patterns

### 1. Ordering Issues (Most Common)

**Symptoms:**
- Snapshot mismatches where items appear in different order
- Arrays contain same elements but in wrong sequence
- Test passes sometimes, fails sometimes

**Cause:** Database queries return results in non-deterministic order (no explicit `ORDER BY`).

**Fix:** Add explicit sorting after fetching data:
```typescript
// Before (brittle)
children: await Promise.all(children.map(toDTO))

// After (stable)
children: (await Promise.all(children.map(toDTO))).sort((a, b) =>
  a.name.localeCompare(b.name)
)
```

**Example:** The "Search categories" test failed because child categories were returned in database insertion order rather than alphabetical order.

---

### 2. Race Conditions

**Symptoms:**
- Test passes locally, fails in CI
- Async operations complete before/after assertions
- Callbacks fire in wrong order

**Cause:** Timing-dependent async code without proper synchronization.

**Fix:** Ensure proper awaiting and synchronization:
```typescript
// Before (brittle)
myFunction(callback);
expect(callback).toHaveBeenCalled();

// After (stable)
await new Promise((resolve) => myFunction(resolve));
expect(callback).toHaveBeenCalled();
```

---

### 3. Timing Issues

**Symptoms:**
- Tests timeout intermittently
- Tests pass locally but fail on slower CI machines
- Arbitrary `sleep()` calls don't help

**Cause:** Fixed timeouts too short for variable-duration operations.

**Fix:** Use polling/retry instead of fixed timeouts:
```typescript
// Before (brittle)
await sleep(100);
expect(data).toBeDefined();

// After (stable)
await waitFor(() => {
  expect(data).toBeDefined();
}, { timeout: 5000 });
```

---

### 4. Resource Contention

**Symptoms:**
- Tests pass alone, fail in full suite
- "Connection pool exhausted" errors
- Database lock errors

**Cause:** Shared resources not properly isolated between tests.

**Fix:**
- Clean database between tests
- Use transactions that rollback
- Reduce test parallelism

---

### 5. Test Isolation Failures

**Symptoms:**
- Tests pass individually, fail together
- Order-dependent failures
- Shared mocks affecting other tests

**Cause:** Global state leaking between tests.

**Fix:**
```typescript
afterEach(() => {
  vi.clearAllMocks();      // Reset all mocks
  vi.resetModules();       // Reset module imports
  // Clean shared state
});
```

---

## Quick Diagnosis

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Snapshot order differs | No ORDER BY | Add sorting |
| Passes locally, fails CI | Timing/race | Add proper waits |
| Passes alone, fails in suite | Isolation | Add cleanup |
| Timeout intermittently | Resource slow | Increase timeout |
| Database constraint error | Stale data | Clean between tests |

---

## Commands Reference

```bash
# Download CI logs
gh run view <RUN_ID> --repo gettakaro/takaro --log-failed

# Run specific test (includes TypeScript check)
docker compose exec takaro npm run test:file <path>

# Debug test (attach debugger)
docker compose exec takaro npm run test:debug <path>

# View service logs
docker compose logs --tail=50 <service>
```
