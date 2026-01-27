---
id: task-001
title: Implement gVisor-based function execution mode
status: To Do
assignee: []
created_date: '2026-01-20 20:50'
updated_date: '2026-01-20 22:15'
labels:
  - security
  - infrastructure
  - functions
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Problem Statement

Takaro needs a self-hostable alternative to AWS Lambda for executing user-defined JavaScript functions (modules). These functions are:
- **Multi-tenant**: Different customers run code on shared infrastructure
- **Untrusted**: Users can write arbitrary JavaScript
- **Lightweight**: Typically short-lived (<30s), call the Takaro API, minimal I/O

Current options:
- **LOCAL mode**: Node.js `vm` module - fast but insecure (shared process, kernel exploits possible)
- **LAMBDA mode**: AWS Lambda - secure but not self-hostable, vendor lock-in

## Solution

Add a new `GVISOR` execution mode that provides Lambda-like security while being self-hosted, using gVisor's application kernel for syscall interception and container isolation.

## Why gVisor?

| Technology | Isolation Level | Startup Time | Memory Overhead |
|------------|-----------------|--------------|-----------------|
| Node.js vm | Process (weak) | ~1ms | ~0 |
| V8 Isolates | Runtime (medium) | ~5ms | ~2MB |
| **gVisor** | Application kernel (strong) | 50-100ms | ~15MB |
| Firecracker | Hardware VM (strongest) | 125ms+ | ~5MB |

- Firecracker requires KVM - not available in most cloud VMs
- gVisor works anywhere Linux runs
- Google Cloud Run uses gVisor for multi-tenant sandboxing
- Keeps existing `vm.SourceTextModule` approach unchanged

## Components to Build

- `packages/app-function-runner` - HTTP service running in gVisor container
- `executeGVisor.ts` executor in app-api
- Squid proxy configuration for network egress control
- Docker/k8s deployment configs with runsc runtime
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 New GVISOR value added to EXECUTION_MODE enum in lib-config
- [ ] #2 packages/app-function-runner HTTP service created with worker thread pool
- [ ] #3 executeGVisor.ts executor calls function-runner via HTTP
- [ ] #4 Container runs with gVisor runtime (runsc) - fails if not available
- [ ] #5 Container runs with --network=none flag
- [ ] #6 Squid proxy container with Unix socket mount for egress control
- [ ] #7 Global domain allowlist enforced by Squid proxy

- [ ] #8 Worker thread timeout enforcement at 2 minutes
- [ ] #9 cgroups enforce CPU (0.5) and memory (256M) limits
- [ ] #10 Read-only root filesystem prevents persistence
- [ ] #11 Fresh vm.SourceTextModule context per execution
- [ ] #12 Horizontal scaling via load balancer across replicas
- [ ] #13 Integration tests pass for commands hooks and cronjobs via gVisor mode
- [ ] #14 Metrics exposed: execution count latency errors timeouts
- [ ] #15 Feature flag to enable gVisor mode per domain for gradual rollout
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Security Model: Multi-Layer Defense

```
User Function Code (JavaScript)
    ↓
Node.js vm.SourceTextModule          ← Memory isolation per execution
    ↓
Application Layer (Node.js process)  ← Worker thread timeout, cgroups limits
    ↓
gVisor Sentry (Application Kernel)   ← Syscall interception & emulation
    ↓
Container Runtime (runsc)            ← Read-only fs, --network=none
    ↓
Host Kernel                          ← Protected from direct access
```

### What gVisor Protects Against
1. **Kernel exploit mitigation**: App never touches real Linux kernel
2. **Container escape prevention**: Trapped in gVisor even if vm escape
3. **Syscall filtering**: Only ~350 of ~400+ syscalls implemented

### What This Does NOT Protect Against
- Side-channel attacks (Spectre/Meltdown)
- Bugs in gVisor itself
- Resource exhaustion (without cgroups)

---

## Scaling Model: Warm Containers + Load Balancer

```
         Load Balancer (round-robin)
                   │
     ┌─────────────┼─────────────┐
     ▼             ▼             ▼
function-runner  function-runner  function-runner
  (gVisor)         (gVisor)         (gVisor)
  Workers          Workers          Workers
```

Matches AWS Lambda pattern: sync HTTP request blocks until complete (up to 2 min).

**Scaling triggers:**
- Add replicas when CPU > 70%
- Each replica: ~256MB memory, 0.5 CPU, ~4 concurrent executions

---

## Resource Limits & Enforcement

| Resource | Mechanism | Where |
|----------|-----------|-------|
| CPU time | cgroups cpu.max | Container runtime |
| Memory | cgroups memory.max | Container runtime |
| Execution time | Worker thread termination | Application code |
| Network egress | --network=none + Squid | Container + Host |
| Disk writes | Read-only filesystem | Container runtime |
| Process spawning | gVisor syscall filter | gVisor Sentry |

### Worker Thread per Execution
- 2-minute hard timeout
- Parent thread terminates worker if exceeded
- Parallelism via thread pool (4-8 workers)
- Worker crash doesn't bring down main process

---

## Network Egress: Container Isolation + Proxy

```
Squid Proxy ←── Unix socket ──→ function-runner (--network=none)
     │
     ▼
Internet (only allowed destinations)
```

**Why secure:**
1. `--network=none` - NO network stack in container
2. Unix socket - ONLY path to outside world
3. Squid enforces domain allowlist
4. Defense in depth - no network even if Node.js compromised

**Same pattern Claude Code on web uses.**
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Decisions Made

| Question | Decision |
|----------|----------|
| Scaling model | Warm containers + round-robin load balancer |
| Network egress | --network=none + Squid proxy with global allowlist |
| Timeout | Hard limit of 2 minutes via worker thread termination |
| Concurrency | Worker thread per execution within each container |
| gVisor requirement | Required - fail if runsc not available |

---

## Remaining Questions

1. **Worker thread pool size**: Recommend 4-8 based on CPU allocation
2. **Squid proxy setup**: Separate container or sidecar? (recommend separate)
3. **Failure handling**: Container crash recovery via restart policy
4. **Gradual rollout**: Feature flag per domain to test alongside Lambda

---

## Deployment: Docker Compose

```yaml
function-runner:
  runtime: runsc
  read_only: true
  deploy:
    replicas: 2
    resources:
      limits:
        cpus: '0.5'
        memory: 256M
```

## Deployment: Kubernetes

```yaml
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: gvisor
handler: runsc
```

---

## gVisor Installation (Debian/Ubuntu)

```bash
curl -fsSL https://gvisor.dev/archive.key | sudo gpg --dearmor -o /usr/share/keyrings/gvisor-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/gvisor-archive-keyring.gpg] https://storage.googleapis.com/gvisor/releases release main" | sudo tee /etc/apt/sources.list.d/gvisor.list
sudo apt-get update && sudo apt-get install -y runsc
```

Configure Docker:
```json
{
  "runtimes": {
    "runsc": { "path": "/usr/bin/runsc" }
  }
}
```

---

## Squid Proxy Allowlist

```
acl allowed_hosts dstdomain .takaro.io
acl allowed_hosts dstdomain discord.com
acl allowed_hosts dstdomain .discord.com
acl allowed_hosts dstdomain hooks.slack.com

http_access allow allowed_hosts
http_access deny all
```

---

## Sources

- https://gvisor.dev/docs/architecture_guide/security/
- https://awsfundamentals.com/blog/sandboxing-with-aws-lambda
- https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html
- https://cloud.google.com/kubernetes-engine/docs/how-to/sandbox-pods
<!-- SECTION:NOTES:END -->
