---
id: task-001
title: Implement gVisor-based function execution mode
status: To Do
assignee: []
created_date: '2026-01-20 20:50'
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
