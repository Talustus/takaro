---
id: task-001
title: Implement gVisor-based function execution mode
status: To Do
assignee: []
created_date: '2026-01-20 20:50'
updated_date: '2026-01-20 22:04'
labels:
  - security
  - infrastructure
  - functions
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a new `GVISOR` execution mode for Takaro functions as a self-hostable alternative to AWS Lambda.

## Design Document
See: `/home/catalysm/.claude/plans/sleepy-herding-wigderson.md`

## Key Architecture Decisions
- **Scaling**: Warm containers with round-robin load balancer (sync HTTP like Lambda)
- **Network**: `--network=none` + Squid proxy via Unix socket for egress control
- **Timeout**: Worker thread per execution with 2-minute hard limit
- **gVisor**: Required - container runtime must be runsc

## Security Layers
1. Node.js vm.SourceTextModule (memory isolation per execution)
2. Worker threads (timeout enforcement)
3. cgroups (CPU/memory limits)
4. gVisor Sentry (syscall interception)
5. Container (`--network=none`, read-only fs)
6. Squid proxy (domain allowlist)

## Components to Build
- `packages/app-function-runner` - HTTP service running in gVisor container
- `executeGVisor.ts` executor in app-api
- Squid proxy configuration
- Docker/k8s deployment configs with runsc runtime
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 gVisor execution mode works as alternative to Lambda
- [ ] #2 Network egress controlled via --network=none + Squid proxy
- [ ] #3 Worker thread timeout enforcement (2 min hard limit)
- [ ] #4 Horizontal scaling via load-balanced replicas
- [ ] #5 cgroups enforce CPU/memory limits
- [ ] #6 Read-only filesystem prevents persistence
- [ ] #7 Integration tests pass for commands, hooks, and cronjobs
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
# Design: gVisor-Based Function Execution for Takaro

## 1. Problem Statement

Takaro needs a self-hostable alternative to AWS Lambda for executing user-defined JavaScript functions (modules). These functions are:
- **Multi-tenant**: Different customers run code on shared infrastructure
- **Untrusted**: Users can write arbitrary JavaScript
- **Lightweight**: Typically short-lived (<30s), call the Takaro API, minimal I/O

Current options:
- **LOCAL mode**: Node.js `vm` module - fast but insecure (shared process, kernel exploits possible)
- **LAMBDA mode**: AWS Lambda - secure but not self-hostable, vendor lock-in

We need a third option that provides Lambda-like security while being self-hosted.

## 2. Technology Landscape

### Isolation Technologies Compared

| Technology | Isolation Level | Startup Time | Memory Overhead | Use Case |
|------------|-----------------|--------------|-----------------|----------|
| **Node.js vm** | Process (weak) | ~1ms | ~0 | Dev only |
| **V8 Isolates** | Runtime (medium) | ~5ms | ~2MB | Edge functions, Cloudflare Workers |
| **gVisor** | Application kernel (strong) | 50-100ms | ~15MB | Multi-tenant containers |
| **Firecracker** | Hardware VM (strongest) | 125ms+ | ~5MB | AWS Lambda, extreme isolation |

**Why gVisor over Firecracker?**
- Firecracker requires KVM (hardware virtualization), not available in most cloud VMs or containers
- gVisor works anywhere Linux runs - VMs, bare metal, even nested containers
- gVisor is what Google Cloud Run uses for multi-tenant sandboxing

**Why gVisor over V8 Isolates?**
- V8 Isolates require transpiling/bundling user code
- gVisor lets us keep the existing `vm.SourceTextModule` approach unchanged
- gVisor provides filesystem and network isolation at kernel level, not just memory

## 3. Security Model

### What gVisor Protects Against

gVisor intercepts all system calls from the container and re-implements them in a userspace "Sentry" process written in Go:

1. **Kernel exploit mitigation**: Application never touches the real Linux kernel
2. **Container escape prevention**: Even if application breaks out of Node.js vm, it's still trapped in gVisor
3. **Syscall filtering**: gVisor only implements ~350 of Linux's ~400+ syscalls

### Multi-Layer Defense

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

### What This Does NOT Protect Against
- Side-channel attacks (Spectre/Meltdown)
- Bugs in gVisor itself
- Resource exhaustion (without cgroups)

## 4. Scaling Model

### Architecture: Warm Containers with Round-Robin Load Balancing

```
         Load Balancer (round-robin)
                   │
     ┌─────────────┼─────────────┐
     ▼             ▼             ▼
function-runner  function-runner  function-runner
  (gVisor)         (gVisor)         (gVisor)
  Workers          Workers          Workers
```

This matches how AWS Lambda works: Takaro API makes a synchronous HTTP request to the function-runner, which blocks until the function completes (up to 2 minutes).

**Safeguards:**
- Read-only filesystem
- Worker thread per execution (timeout + parallelism)
- Network isolation via `--network=none` + proxy

**Scaling:**
- Add replicas when CPU > 70%
- Each replica: ~256MB memory, 0.5 CPU, ~4 concurrent executions

## 5. Resource Limits & Timeout Enforcement

### Enforcement Layers

| Resource | Enforcement Mechanism | Where |
|----------|----------------------|-------|
| CPU time | cgroups cpu.max | Container runtime |
| Memory | cgroups memory.max | Container runtime |
| Execution time | Worker thread termination | Application code |
| Network egress | --network=none + Squid proxy | Container + Host |
| Disk writes | Read-only filesystem | Container runtime |
| Process spawning | gVisor syscall filter | gVisor Sentry |

### Worker Thread per Execution with 2-Minute Hard Limit

Each function execution runs in a dedicated worker thread:
1. Timeout enforcement - parent can terminate worker
2. Parallelism - multiple executions concurrently
3. Isolation - worker crash doesn't bring down main process

## 6. Network Egress Control

### Decision: Container-Level Network Isolation with Proxy

Run gVisor container with `--network=none` and route all HTTP through Squid proxy via Unix socket.

```
Squid Proxy ←── Unix socket ──→ function-runner (--network=none)
     │
     ▼
Internet (only allowed destinations)
```

**Why this is secure:**
1. `--network=none` - Container has NO network stack
2. Unix socket - ONLY way to reach outside is through proxy
3. Squid proxy enforces allowlist
4. Defense in depth - even if Node.js compromised, no network

**Proxy allowlist (Squid):**
```
acl allowed_hosts dstdomain .takaro.io
acl allowed_hosts dstdomain discord.com
acl allowed_hosts dstdomain hooks.slack.com
http_access allow allowed_hosts
http_access deny all
```

## 7. Operational Considerations

### Docker Compose
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

### gVisor Installation
```bash
curl -fsSL https://gvisor.dev/archive.key | sudo gpg --dearmor -o /usr/share/keyrings/gvisor-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/gvisor-archive-keyring.gpg] https://storage.googleapis.com/gvisor/releases release main" | sudo tee /etc/apt/sources.list.d/gvisor.list
sudo apt-get update && sudo apt-get install -y runsc
```

## 8. Decisions Made

| Question | Decision |
|----------|----------|
| Scaling model | Warm containers + round-robin load balancer |
| Network egress | --network=none + Squid proxy with global allowlist |
| Timeout | Hard limit of 2 minutes via worker thread termination |
| Concurrency | Worker thread per execution |
| gVisor requirement | Required - fail if runsc not available |

## 9. Remaining Questions

1. Worker thread pool size (recommend 4-8)
2. Squid proxy setup - separate container or sidecar
3. Failure handling - container crash recovery
4. Gradual rollout - feature flag per domain

## 10. Sources

- https://gvisor.dev/docs/architecture_guide/security/
- https://awsfundamentals.com/blog/sandboxing-with-aws-lambda
- https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html
- https://cloud.google.com/kubernetes-engine/docs/how-to/sandbox-pods
<!-- SECTION:PLAN:END -->
