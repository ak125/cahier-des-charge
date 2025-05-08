# Rapport d'audit des orchestrateurs
  
> Généré le : 28/04/2025 22:48:31

Ce rapport identifie toutes les utilisations directes des orchestrateurs BullMQ, Temporal et n8n dans le projet,
et propose un plan de migration vers l'orchestrateur standardisé.

## Résumé

- **Utilisations directes détectées** : 491
- **BullMQ** : 432 utilisations directes
- **Temporal** : 54 utilisations directes
- **n8n** : 5 utilisations directes
- **Orchestrateur standardisé** : 100 utilisations

## Utilisations directes de BullMQ

Les tâches suivantes utilisent BullMQ directement et devraient être migrées vers `standardizedOrchestrator.scheduleTask` avec `TaskType.SIMPLE`.

| Fichier | Ligne | Utilisation détectée | Classification suggérée |
|---------|-------|---------------------|--------------------------|
| `/workspaces/cahier-des-charge/apps/frontend/app/routes/admin/jobs/retry.tsx` | 3 | `import { Queue } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/apps/frontend/app/routes/admin/jobs/retry.tsx` | 73 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/apps/frontend/app/routes/admin/jobs/retry.tsx` | 102 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/apps/frontend/app/routes/admin/jobs/retry.tsx` | 118 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bullmq.service.ts` | 2 | `import { Queue, JobsOptions } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 73 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 102 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 118 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 11 | `return new Queue('PhpAnalyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 22 | `return new Queue('js-analyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 33 | `return new Queue('migration', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 44 | `return new Queue('verification', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 73 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 102 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 118 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/apps/mcp-server/src/bullmq/bullmq.module.ts` | 11 | `return new Queue('PhpAnalyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/apps/mcp-server/src/bullmq/bullmq.module.ts` | 22 | `return new Queue('js-analyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/apps/mcp-server/src/bullmq/bullmq.module.ts` | 33 | `return new Queue('migration', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/apps/mcp-server/src/bullmq/bullmq.module.ts` | 44 | `return new Queue('verification', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/business/agents/agent/agent-runner_2afd4b00.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/business/agents/agent/agent-runner_2afd4b00.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/business/agents/agent/agent-runner_2afd4b00.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/business/agents/agent/agent-runner_4d221e77.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/business/agents/agent/agent-runner_4d221e77.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/business/agents/agent/agent-runner_4d221e77.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/business/agents/agent/agent-runner_85dadde2.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/business/agents/agent/agent-runner_85dadde2_57c0d58d.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/business/agents/agent/agent-runner_85dadde2_57c0d58d.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/business/agents/agent/agent-runner_85dadde2_57c0d58d.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/business/agents/agent/agent-runner_85dadde2_7dd6e46a.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/business/agents/agent/agent-runner_85dadde2_7dd6e46a.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/business/agents/agent/agent-runner_85dadde2_7dd6e46a.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 73 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 102 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 118 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 11 | `return new Queue('PhpAnalyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 22 | `return new Queue('js-analyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 33 | `return new Queue('migration', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 44 | `return new Queue('verification', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/business/agents/agent/agent-runner_85dadde2.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/business/agents/agent/agent-runner_85dadde2.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 73 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 102 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 118 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 11 | `return new Queue('PhpAnalyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 22 | `return new Queue('js-analyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 33 | `return new Queue('migration', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 44 | `return new Queue('verification', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 73 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 102 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 118 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/apps/mcp-server/src/bullmq/bullmq.module.ts` | 11 | `return new Queue('PhpAnalyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/apps/mcp-server/src/bullmq/bullmq.module.ts` | 22 | `return new Queue('js-analyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/apps/mcp-server/src/bullmq/bullmq.module.ts` | 33 | `return new Queue('migration', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/apps/mcp-server/src/bullmq/bullmq.module.ts` | 44 | `return new Queue('verification', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/business/agents/agent/agent-runner_2afd4b00.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/business/agents/agent/agent-runner_2afd4b00.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/business/agents/agent/agent-runner_2afd4b00.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/business/agents/agent/agent-runner_4d221e77.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/business/agents/agent/agent-runner_4d221e77.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/business/agents/agent/agent-runner_4d221e77.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2_57c0d58d.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2_57c0d58d.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2_57c0d58d.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2_7dd6e46a.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2_7dd6e46a.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2_7dd6e46a.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 73 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 102 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 118 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 11 | `return new Queue('PhpAnalyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 22 | `return new Queue('js-analyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 33 | `return new Queue('migration', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 44 | `return new Queue('verification', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/business/agents/agent/agent-runner_85dadde2.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/business/agents/agent/agent-runner_85dadde2.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/apps/frontend/app/routes/admin/jobs/retry.tsx` | 73 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/apps/frontend/app/routes/admin/jobs/retry.tsx` | 102 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/apps/frontend/app/routes/admin/jobs/retry.tsx` | 118 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/apps/mcp-server/src/bullmq/bullmq.module.ts` | 11 | `return new Queue('PhpAnalyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/apps/mcp-server/src/bullmq/bullmq.module.ts` | 22 | `return new Queue('js-analyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/apps/mcp-server/src/bullmq/bullmq.module.ts` | 33 | `return new Queue('migration', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/apps/mcp-server/src/bullmq/bullmq.module.ts` | 44 | `return new Queue('verification', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/business/agents/agent/agent-runner_2afd4b00.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/business/agents/agent/agent-runner_2afd4b00.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/business/agents/agent/agent-runner_2afd4b00.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/business/agents/agent/agent-runner_4d221e77.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/business/agents/agent/agent-runner_4d221e77.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/business/agents/agent/agent-runner_4d221e77.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/business/agents/agent/agent-runner_85dadde2_57c0d58d.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/business/agents/agent/agent-runner_85dadde2_57c0d58d.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/business/agents/agent/agent-runner_85dadde2_57c0d58d.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/business/agents/agent/agent-runner_85dadde2_7dd6e46a.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/business/agents/agent/agent-runner_85dadde2_7dd6e46a.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/business/agents/agent/agent-runner_85dadde2_7dd6e46a.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 73 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 102 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 118 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 11 | `return new Queue('PhpAnalyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 22 | `return new Queue('js-analyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 33 | `return new Queue('migration', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 44 | `return new Queue('verification', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 73 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 102 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 118 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/apps/mcp-server/src/bullmq/bullmq.module.ts` | 11 | `return new Queue('PhpAnalyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/apps/mcp-server/src/bullmq/bullmq.module.ts` | 22 | `return new Queue('js-analyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/apps/mcp-server/src/bullmq/bullmq.module.ts` | 33 | `return new Queue('migration', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/apps/mcp-server/src/bullmq/bullmq.module.ts` | 44 | `return new Queue('verification', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/business/agents/agent/agent-runner_2afd4b00.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/business/agents/agent/agent-runner_2afd4b00.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/business/agents/agent/agent-runner_2afd4b00.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/business/agents/agent/agent-runner_4d221e77.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/business/agents/agent/agent-runner_4d221e77.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/business/agents/agent/agent-runner_4d221e77.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2_57c0d58d.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2_57c0d58d.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2_57c0d58d.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2_7dd6e46a.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2_7dd6e46a.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2_7dd6e46a.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 73 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 102 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 118 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 11 | `return new Queue('PhpAnalyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 22 | `return new Queue('js-analyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 33 | `return new Queue('migration', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/apps/mcp-server/src/bullmq/bullmq.module.ts` | 44 | `return new Queue('verification', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/business/agents/agent/agent-runner_85dadde2.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-015615/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/business/agents/agent/agent-runner_85dadde2.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/business/agents/agent/agent-runner_85dadde2.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-015615/structure-backups/20250424-012046/structure-backups/20250424-012046/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/apps/frontend/app/routes/admin/jobs/retry.tsx` | 73 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/apps/frontend/app/routes/admin/jobs/retry.tsx` | 102 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/apps/frontend/app/routes/admin/jobs/retry.tsx` | 118 | `const queue = new Queue(DoDotmcp-jobs', { connection: redisClient });` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/apps/frontend/app/routes/admin/jobs/retry.tsx` | 75 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/apps/frontend/app/routes/admin/jobs/retry.tsx` | 104 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/apps/frontend/app/routes/admin/jobs/retry.tsx` | 120 | `await queue.add(` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/apps/mcp-server/src/bullmq/bullmq.module.ts` | 11 | `return new Queue('PhpAnalyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/apps/mcp-server/src/bullmq/bullmq.module.ts` | 22 | `return new Queue('js-analyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/apps/mcp-server/src/bullmq/bullmq.module.ts` | 33 | `return new Queue('migration', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/apps/mcp-server/src/bullmq/bullmq.module.ts` | 44 | `return new Queue('verification', {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/business/agents/agent/agent-runner_2afd4b00.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/business/agents/agent/agent-runner_2afd4b00.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/business/agents/agent/agent-runner_2afd4b00.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/business/agents/agent/agent-runner_4d221e77.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/business/agents/agent/agent-runner_4d221e77.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/business/agents/agent/agent-runner_4d221e77.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/business/agents/agent/agent-runner_85dadde2_57c0d58d.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/business/agents/agent/agent-runner_85dadde2_57c0d58d.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/business/agents/agent/agent-runner_85dadde2_57c0d58d.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/business/agents/agent/agent-runner_85dadde2_7dd6e46a.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/business/agents/agent/agent-runner_85dadde2_7dd6e46a.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/business/agents/agent/agent-runner_85dadde2_7dd6e46a.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/business/agents/agent/agent-runner_2afd4b00.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/business/agents/agent/agent-runner_2afd4b00.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/business/agents/agent/agent-runner_2afd4b00.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/business/agents/agent/agent-runner_4d221e77.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/business/agents/agent/agent-runner_4d221e77.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/business/agents/agent/agent-runner_4d221e77.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/business/agents/agent/agent-runner_85dadde2_57c0d58d.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/business/agents/agent/agent-runner_85dadde2_57c0d58d.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/business/agents/agent/agent-runner_85dadde2_57c0d58d.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/business/agents/agent/agent-runner_85dadde2_7dd6e46a.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/business/agents/agent/agent-runner_85dadde2_7dd6e46a.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/business/agents/agent/agent-runner_85dadde2_7dd6e46a.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/consolidation-2025-04-17/agents/integration/orchestrator-bridge.ts` | 2 | `import { Queue, Worker, QueueEvents } from "bullmq";` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/consolidation-2025-04-17/agents/integration/orchestrator-bridge.ts` | 126 | `this.bullMQQueues[queueName] = new Queue(queueName, {` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/consolidation-2025-04-17/agents/integration/orchestrator-bridge.ts` | 840 | `const job = await queue.add(signalType, payload.jobData);` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/consolidation-2025-04-17/agents/integration/orchestrator-bridge.ts` | 840 | `const job = await queue.add(signalType, payload.jobData);` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/OrchestratorBridge/orchestrator-bridge.ts` | 3 | `import { Queue, Worker, QueueEvents } from "bullmq";` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/OrchestratorBridge/orchestrator-bridge.ts` | 127 | `this.bullMQQueues[queueName] = new Queue(queueName, {` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/OrchestratorBridge/orchestrator-bridge.ts` | 841 | `const job = await queue.add(signalType, payload.jobData);` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/OrchestratorBridge/orchestrator-bridge.ts` | 841 | `const job = await queue.add(signalType, payload.jobData);` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/orchestrator-bridge/orchestrator-bridge.ts` | 3 | `import { Queue, Worker, QueueEvents } from "bullmq";` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/orchestrator-bridge/orchestrator-bridge.ts` | 127 | `this.bullMQQueues[queueName] = new Queue(queueName, {` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/orchestrator-bridge/orchestrator-bridge.ts` | 841 | `const job = await queue.add(signalType, payload.jobData);` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/orchestrator-bridge/orchestrator-bridge.ts` | 841 | `const job = await queue.add(signalType, payload.jobData);` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/migration-2025-04-17/agents/bullmq-orchestrator.ts` | 1 | `import { Worker, Queue, QueueScheduler, FlowProducer, Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/migration-2025-04-17/agents/bullmq-orchestrator.ts` | 33 | `this.queues['orchestrator'] = new Queue('orchestrator', { connection: this.redisOptions });` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/migration-2025-04-17/agents/bullmq-orchestrator.ts` | 34 | `this.queues['PhpAnalyzer'] = new Queue('PhpAnalyzer', { connection: this.redisOptions });` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/migration-2025-04-17/agents/bullmq-orchestrator.ts` | 35 | `this.queues['js-analyzer'] = new Queue('js-analyzer', { connection: this.redisOptions });` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/migration-2025-04-17/agents/bullmq-orchestrator.ts` | 36 | `this.queues['migration'] = new Queue('migration', { connection: this.redisOptions });` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/migration-2025-04-17/agents/migration-orchestrator.ts` | 19 | `import { Queue, Worker } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/migration-2025-04-17/agents/migration-orchestrator.ts` | 696 | `const queue = new Queue(DoDotmcp-jobs', {` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/migration-2025-04-17/agents/migration-orchestrator.ts` | 703 | `await queue.add(agentType, {` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/migration-2025-04-17/agents/migration-orchestrator.ts` | 703 | `await queue.add(agentType, {` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/migration-2025-04-17/agents/status-writer.ts` | 4 | `import { Queue, Worker, Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/migration-2025-04-17/agents/status-writer.ts` | 369 | `const queue = new Queue(DoDotmcp-jobs', {` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/migration-2025-04-17/agents/workers/mcp-verifier.worker.ts` | 1 | `import { Worker, Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/legacy/migration-2025-04-17/agents/workers/php-analyzer.worker.ts` | 1 | `import { Worker, Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/packages/mcp-orchestrator/agent-runner.ts` | 16 | `import { Queue, QueueScheduler } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/packages/mcp-orchestrator/agent-runner.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/legacy-cleanup/backup-20250420-022736/unique-agents/legacy/consolidation-2025-04-17/agents/integration/orchestrator-bridge.ts` | 2 | `import { Queue, Worker, QueueEvents } from "bullmq";` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/legacy-cleanup/backup-20250420-022736/unique-agents/legacy/consolidation-2025-04-17/agents/integration/orchestrator-bridge.ts` | 126 | `this.bullMQQueues[queueName] = new Queue(queueName, {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/legacy-cleanup/backup-20250420-022736/unique-agents/legacy/consolidation-2025-04-17/agents/integration/orchestrator-bridge.ts` | 840 | `const job = await queue.add(signalType, payload.jobData);` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/legacy-cleanup/backup-20250420-022736/unique-agents/legacy/consolidation-2025-04-17/agents/integration/orchestrator-bridge.ts` | 840 | `const job = await queue.add(signalType, payload.jobData);` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/legacy-cleanup/backup-20250420-022736/unique-agents/legacy/migration-2025-04-17/agents/bullmq-orchestrator.ts` | 1 | `import { Worker, Queue, QueueScheduler, FlowProducer, Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/legacy-cleanup/backup-20250420-022736/unique-agents/legacy/migration-2025-04-17/agents/bullmq-orchestrator.ts` | 33 | `this.queues['orchestrator'] = new Queue('orchestrator', { connection: this.redisOptions });` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/legacy-cleanup/backup-20250420-022736/unique-agents/legacy/migration-2025-04-17/agents/bullmq-orchestrator.ts` | 34 | `this.queues['PhpAnalyzer'] = new Queue('PhpAnalyzer', { connection: this.redisOptions });` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/legacy-cleanup/backup-20250420-022736/unique-agents/legacy/migration-2025-04-17/agents/bullmq-orchestrator.ts` | 35 | `this.queues['js-analyzer'] = new Queue('js-analyzer', { connection: this.redisOptions });` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/legacy-cleanup/backup-20250420-022736/unique-agents/legacy/migration-2025-04-17/agents/bullmq-orchestrator.ts` | 36 | `this.queues['migration'] = new Queue('migration', { connection: this.redisOptions });` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/legacy-cleanup/backup-20250420-022736/unique-agents/legacy/migration-2025-04-17/agents/migration-orchestrator.ts` | 19 | `import { Queue, Worker } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/legacy-cleanup/backup-20250420-022736/unique-agents/legacy/migration-2025-04-17/agents/migration-orchestrator.ts` | 696 | `const queue = new Queue(DoDotmcp-jobs', {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/legacy-cleanup/backup-20250420-022736/unique-agents/legacy/migration-2025-04-17/agents/migration-orchestrator.ts` | 703 | `await queue.add(agentType, {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/legacy-cleanup/backup-20250420-022736/unique-agents/legacy/migration-2025-04-17/agents/migration-orchestrator.ts` | 703 | `await queue.add(agentType, {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/legacy-cleanup/backup-20250420-022736/unique-agents/legacy/migration-2025-04-17/agents/status-writer.ts` | 4 | `import { Queue, Worker, Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/legacy-cleanup/backup-20250420-022736/unique-agents/legacy/migration-2025-04-17/agents/status-writer.ts` | 369 | `const queue = new Queue(DoDotmcp-jobs', {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/legacy-cleanup/backup-20250420-022736/unique-agents/legacy/migration-2025-04-17/agents/workers/mcp-verifier.worker.ts` | 1 | `import { Worker, Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/legacy-cleanup/backup-20250420-022736/unique-agents/legacy/migration-2025-04-17/agents/workers/php-analyzer.worker.ts` | 1 | `import { Worker, Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/migration-finalization-20250420-012655/backup/docs/agents/bullmq-orchestrator.ts` | 1 | `import { Worker, Queue, QueueScheduler, FlowProducer, Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/migration-finalization-20250420-012655/backup/docs/agents/bullmq-orchestrator.ts` | 35 | `this.queues['orchestrator'] = new Queue('orchestrator', { connection: this.redisOptions });` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/migration-finalization-20250420-012655/backup/docs/agents/bullmq-orchestrator.ts` | 36 | `this.queues['PhpAnalyzer'] = new Queue('PhpAnalyzer', { connection: this.redisOptions });` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/migration-finalization-20250420-012655/backup/docs/agents/bullmq-orchestrator.ts` | 37 | `this.queues['js-analyzer'] = new Queue('js-analyzer', { connection: this.redisOptions });` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/migration-finalization-20250420-012655/backup/docs/agents/bullmq-orchestrator.ts` | 38 | `this.queues['migration'] = new Queue('migration', { connection: this.redisOptions });` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/migration-finalization-20250420-012655/backup/docs/agents/mcp-verifier.worker.ts` | 1 | `import { Worker, Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/migration-finalization-20250420-012655/backup/docs/agents/migration-orchestrator.ts` | 19 | `import { Queue, Worker } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/migration-finalization-20250420-012655/backup/docs/agents/migration-orchestrator.ts` | 698 | `const queue = new Queue(DoDotmcp-jobs', {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/migration-finalization-20250420-012655/backup/docs/agents/migration-orchestrator.ts` | 705 | `await queue.add(agentType, {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/migration-finalization-20250420-012655/backup/docs/agents/migration-orchestrator.ts` | 705 | `await queue.add(agentType, {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/migration-finalization-20250420-012655/backup/docs/agents/orchestrator-bridge.ts` | 3 | `import { Queue, Worker, QueueEvents } from "bullmq";` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/migration-finalization-20250420-012655/backup/docs/agents/orchestrator-bridge.ts` | 129 | `this.bullMQQueues[queueName] = new Queue(queueName, {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/migration-finalization-20250420-012655/backup/docs/agents/orchestrator-bridge.ts` | 887 | `const job = await queue.add(signalType, payload.jobData);` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/migration-finalization-20250420-012655/backup/docs/agents/orchestrator-bridge.ts` | 887 | `const job = await queue.add(signalType, payload.jobData);` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/migration-finalization-20250420-012655/backup/docs/agents/php-analyzer.worker.ts` | 1 | `import { Worker, Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/migration-finalization-20250420-012655/backup/docs/agents/status-writer.ts` | 4 | `import { Queue, Worker, Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/migration-finalization-20250420-012655/backup/docs/agents/status-writer.ts` | 371 | `const queue = new Queue(DoDotmcp-jobs', {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/apps/mcp-server/src/bullmq/bullmq.module.ts` | 2 | `import { Queue } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/apps/mcp-server/src/bullmq/bullmq.module.ts` | 11 | `return new Queue('PhpAnalyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/apps/mcp-server/src/bullmq/bullmq.module.ts` | 22 | `return new Queue('js-analyzer', {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/apps/mcp-server/src/bullmq/bullmq.module.ts` | 33 | `return new Queue('migration', {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/apps/mcp-server/src/bullmq/bullmq.module.ts` | 44 | `return new Queue('verification', {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/apps/mcp-server/src/bullmq/bullmq.service.ts` | 2 | `import { Queue, JobsOptions } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/OrchestratorBridge/orchestrator-bridge.ts` | 3 | `import { Queue, Worker, QueueEvents } from "bullmq";` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/OrchestratorBridge/orchestrator-bridge.ts` | 127 | `this.bullMQQueues[queueName] = new Queue(queueName, {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/OrchestratorBridge/orchestrator-bridge.ts` | 841 | `const job = await queue.add(signalType, payload.jobData);` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/OrchestratorBridge/orchestrator-bridge.ts` | 841 | `const job = await queue.add(signalType, payload.jobData);` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/orchestrator-bridge/orchestrator-bridge.ts` | 3 | `import { Queue, Worker, QueueEvents } from "bullmq";` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/orchestrator-bridge/orchestrator-bridge.ts` | 127 | `this.bullMQQueues[queueName] = new Queue(queueName, {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/orchestrator-bridge/orchestrator-bridge.ts` | 841 | `const job = await queue.add(signalType, payload.jobData);` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/orchestrator-bridge/orchestrator-bridge.ts` | 841 | `const job = await queue.add(signalType, payload.jobData);` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/migration-2025-04-17/agents/bullmq-orchestrator.ts` | 1 | `import { Worker, Queue, QueueScheduler, FlowProducer, Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/migration-2025-04-17/agents/bullmq-orchestrator.ts` | 33 | `this.queues['orchestrator'] = new Queue('orchestrator', { connection: this.redisOptions });` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/migration-2025-04-17/agents/bullmq-orchestrator.ts` | 34 | `this.queues['PhpAnalyzer'] = new Queue('PhpAnalyzer', { connection: this.redisOptions });` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/migration-2025-04-17/agents/bullmq-orchestrator.ts` | 35 | `this.queues['js-analyzer'] = new Queue('js-analyzer', { connection: this.redisOptions });` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/migration-2025-04-17/agents/bullmq-orchestrator.ts` | 36 | `this.queues['migration'] = new Queue('migration', { connection: this.redisOptions });` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/migration-2025-04-17/agents/migration-orchestrator.ts` | 19 | `import { Queue, Worker } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/migration-2025-04-17/agents/migration-orchestrator.ts` | 696 | `const queue = new Queue(DoDotmcp-jobs', {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/migration-2025-04-17/agents/migration-orchestrator.ts` | 703 | `await queue.add(agentType, {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/migration-2025-04-17/agents/migration-orchestrator.ts` | 703 | `await queue.add(agentType, {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/migration-2025-04-17/agents/status-writer.ts` | 4 | `import { Queue, Worker, Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/migration-2025-04-17/agents/status-writer.ts` | 369 | `const queue = new Queue(DoDotmcp-jobs', {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/migration-2025-04-17/agents/workers/mcp-verifier.worker.ts` | 1 | `import { Worker, Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/migration-2025-04-17/agents/workers/php-analyzer.worker.ts` | 1 | `import { Worker, Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/packages/mcp-orchestrator/agent-runner.ts` | 16 | `import { Queue, QueueScheduler } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/packages/mcp-orchestrator/agent-runner.ts` | 148 | `this.queues[agentType] = new Queue(DoDotmcp-${agentType}`, {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/packages/mcp-orchestrator/agent-runner.ts` | 211 | `const job = await queue.add(context.filename, context, {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/reports/migration-finalization-20250420-012655/backup/docs/agents/bullmq-orchestrator.ts` | 1 | `import { Worker, Queue, QueueScheduler, FlowProducer, Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/reports/migration-finalization-20250420-012655/backup/docs/agents/bullmq-orchestrator.ts` | 35 | `this.queues['orchestrator'] = new Queue('orchestrator', { connection: this.redisOptions });` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/reports/migration-finalization-20250420-012655/backup/docs/agents/bullmq-orchestrator.ts` | 36 | `this.queues['PhpAnalyzer'] = new Queue('PhpAnalyzer', { connection: this.redisOptions });` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/reports/migration-finalization-20250420-012655/backup/docs/agents/bullmq-orchestrator.ts` | 37 | `this.queues['js-analyzer'] = new Queue('js-analyzer', { connection: this.redisOptions });` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/reports/migration-finalization-20250420-012655/backup/docs/agents/bullmq-orchestrator.ts` | 38 | `this.queues['migration'] = new Queue('migration', { connection: this.redisOptions });` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/reports/migration-finalization-20250420-012655/backup/docs/agents/mcp-verifier.worker.ts` | 1 | `import { Worker, Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/reports/migration-finalization-20250420-012655/backup/docs/agents/migration-orchestrator.ts` | 19 | `import { Queue, Worker } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/reports/migration-finalization-20250420-012655/backup/docs/agents/migration-orchestrator.ts` | 698 | `const queue = new Queue(DoDotmcp-jobs', {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/reports/migration-finalization-20250420-012655/backup/docs/agents/migration-orchestrator.ts` | 705 | `await queue.add(agentType, {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/reports/migration-finalization-20250420-012655/backup/docs/agents/migration-orchestrator.ts` | 705 | `await queue.add(agentType, {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/reports/migration-finalization-20250420-012655/backup/docs/agents/orchestrator-bridge.ts` | 3 | `import { Queue, Worker, QueueEvents } from "bullmq";` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/reports/migration-finalization-20250420-012655/backup/docs/agents/orchestrator-bridge.ts` | 129 | `this.bullMQQueues[queueName] = new Queue(queueName, {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/reports/migration-finalization-20250420-012655/backup/docs/agents/orchestrator-bridge.ts` | 887 | `const job = await queue.add(signalType, payload.jobData);` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/reports/migration-finalization-20250420-012655/backup/docs/agents/orchestrator-bridge.ts` | 887 | `const job = await queue.add(signalType, payload.jobData);` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/reports/migration-finalization-20250420-012655/backup/docs/agents/php-analyzer.worker.ts` | 1 | `import { Worker, Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/reports/migration-finalization-20250420-012655/backup/docs/agents/status-writer.ts` | 4 | `import { Queue, Worker, Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/reports/migration-finalization-20250420-012655/backup/docs/agents/status-writer.ts` | 371 | `const queue = new Queue(DoDotmcp-jobs', {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/src/orchestration/orchestrators/OrchestratorBridge/orchestrator-bridge.ts` | 3 | `import { Queue, Worker, QueueEvents } from "bullmq";` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/src/orchestration/orchestrators/OrchestratorBridge/orchestrator-bridge.ts` | 129 | `this.bullMQQueues[queueName] = new Queue(queueName, {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/src/orchestration/orchestrators/OrchestratorBridge/orchestrator-bridge.ts` | 887 | `const job = await queue.add(signalType, payload.jobData);` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/src/orchestration/orchestrators/OrchestratorBridge/orchestrator-bridge.ts` | 887 | `const job = await queue.add(signalType, payload.jobData);` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/src/orchestration/orchestrators/orchestrator-bridge/orchestrator-bridge.ts` | 3 | `import { Queue, Worker, QueueEvents } from "bullmq";` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/src/orchestration/orchestrators/orchestrator-bridge/orchestrator-bridge.ts` | 129 | `this.bullMQQueues[queueName] = new Queue(queueName, {` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/src/orchestration/orchestrators/orchestrator-bridge/orchestrator-bridge.ts` | 887 | `const job = await queue.add(signalType, payload.jobData);` | SIMPLE |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/src/orchestration/orchestrators/orchestrator-bridge/orchestrator-bridge.ts` | 887 | `const job = await queue.add(signalType, payload.jobData);` | SIMPLE |
| `/workspaces/cahier-des-charge/scripts/audit-orchestrators.js` | 217 | `import { Queue } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/scripts/audit-orchestrators.js` | 218 | `const queue = new Queue('my-queue');` | SIMPLE |
| `/workspaces/cahier-des-charge/scripts/audit-orchestrators.js` | 219 | `await queue.add('my-job', { data: 'value' });` | SIMPLE |
| `/workspaces/cahier-des-charge/scripts/audit-orchestrators.js` | 219 | `await queue.add('my-job', { data: 'value' });` | SIMPLE |
| `/workspaces/cahier-des-charge/src/orchestration/examples/workflow-example.ts` | 9 | `import { Job } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/src/orchestration/monitoring/unified-dashboard.ts` | 13 | `import { Queue } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/src/orchestration/orchestrator-adapter.ts` | 22 | `import { Connection, Queue, Worker, Job, QueueEvents } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/src/orchestration/orchestrator-adapter.ts` | 165 | `queue = new Queue(task.name, {` | SIMPLE |
| `/workspaces/cahier-des-charge/src/orchestration/orchestrator-adapter.ts` | 181 | `const job = await queue.add(task.name, task.payload, bullmqOptions);` | SIMPLE |
| `/workspaces/cahier-des-charge/src/orchestration/orchestrator-adapter.ts` | 181 | `const job = await queue.add(task.name, task.payload, bullmqOptions);` | SIMPLE |
| `/workspaces/cahier-des-charge/src/orchestration/unified-orchestrator.ts` | 9 | `import { Connection, Queue, Worker, Job, QueueEvents } from 'bullmq';` | SIMPLE |
| `/workspaces/cahier-des-charge/src/orchestration/unified-orchestrator.ts` | 119 | `const queue = new Queue(queueName, {` | SIMPLE |
| `/workspaces/cahier-des-charge/src/orchestration/unified-orchestrator.ts` | 141 | `queue = new Queue(task.name, {` | SIMPLE |
| `/workspaces/cahier-des-charge/src/orchestration/unified-orchestrator.ts` | 174 | `const job = await queue.add(task.name, task.payload, bullmqOptions);` | SIMPLE |
| `/workspaces/cahier-des-charge/src/orchestration/unified-orchestrator.ts` | 174 | `const job = await queue.add(task.name, task.payload, bullmqOptions);` | SIMPLE |

## Utilisations directes de Temporal

Les workflows suivants utilisent Temporal directement et devraient être migrés vers `standardizedOrchestrator.scheduleTask` avec `TaskType.COMPLEX`.

| Fichier | Ligne | Utilisation détectée | Classification suggérée |
|---------|-------|---------------------|--------------------------|
| `/workspaces/cahier-des-charge/backups/20250424-012046/src/temporal/client.ts` | 25 | `const handle = await client.workflow.start(workflowType, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/20250424-012046/src/temporal/testing/workflow-tester.ts` | 114 | `const workflowPromise = this.client.workflow.execute(workflowName, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/20250424-015615/src/temporal/client.ts` | 25 | `const handle = await client.workflow.start(workflowType, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/20250424-015615/src/temporal/testing/workflow-tester.ts` | 114 | `const workflowPromise = this.client.workflow.execute(workflowName, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/src/temporal/client.ts` | 25 | `const handle = await client.workflow.start(workflowType, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/20250424-015615/structure-backups/20250424-012046/src/temporal/testing/workflow-tester.ts` | 114 | `const workflowPromise = this.client.workflow.execute(workflowName, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-012046/src/temporal/client.ts` | 25 | `const handle = await client.workflow.start(workflowType, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-012046/src/temporal/testing/workflow-tester.ts` | 114 | `const workflowPromise = this.client.workflow.execute(workflowName, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/src/temporal/client.ts` | 25 | `const handle = await client.workflow.start(workflowType, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/src/temporal/testing/workflow-tester.ts` | 114 | `const workflowPromise = this.client.workflow.execute(workflowName, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/src/temporal/client.ts` | 25 | `const handle = await client.workflow.start(workflowType, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/backup_structure-backups/20250424-015615/structure-backups/20250424-012046/src/temporal/testing/workflow-tester.ts` | 114 | `const workflowPromise = this.client.workflow.execute(workflowName, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/src/temporal/client.ts` | 25 | `const handle = await client.workflow.start(workflowType, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/src/temporal/testing/workflow-tester.ts` | 114 | `const workflowPromise = this.client.workflow.execute(workflowName, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-012046/src/temporal/client.ts` | 25 | `const handle = await client.workflow.start(workflowType, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-012046/src/temporal/testing/workflow-tester.ts` | 114 | `const workflowPromise = this.client.workflow.execute(workflowName, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/src/temporal/client.ts` | 25 | `const handle = await client.workflow.start(workflowType, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/src/temporal/testing/workflow-tester.ts` | 114 | `const workflowPromise = this.client.workflow.execute(workflowName, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/src/temporal/client.ts` | 25 | `const handle = await client.workflow.start(workflowType, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/structure-backups/20250424-015615/structure-backups/20250424-012046/src/temporal/testing/workflow-tester.ts` | 114 | `const workflowPromise = this.client.workflow.execute(workflowName, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/src/temporal/client.ts` | 25 | `const handle = await client.workflow.start(workflowType, {` | COMPLEX |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/src/temporal/testing/workflow-tester.ts` | 114 | `const workflowPromise = this.client.workflow.execute(workflowName, {` | COMPLEX |
| `/workspaces/cahier-des-charge/legacy/consolidation-2025-04-17/agents/integration/orchestrator-bridge.ts` | 1 | `import { Client as TemporalClient } from "@temporalio/client";` | COMPLEX |
| `/workspaces/cahier-des-charge/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/adapters/temporal-adapter.ts` | 17 | `import { Connection, Client, WorkflowClient } from '@temporalio/client';` | COMPLEX |
| `/workspaces/cahier-des-charge/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/adapters/temporal-adapter.ts` | 217 | `const handle = await this.client.workflow.start(temporalDefinition.workflowId, {` | COMPLEX |
| `/workspaces/cahier-des-charge/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/OrchestratorBridge/orchestrator-bridge.ts` | 2 | `import { Client as TemporalClient } from "@temporalio/client";` | COMPLEX |
| `/workspaces/cahier-des-charge/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/orchestrator-bridge/orchestrator-bridge.ts` | 2 | `import { Client as TemporalClient } from "@temporalio/client";` | COMPLEX |
| `/workspaces/cahier-des-charge/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/implementations/temporal-adapter.ts` | 1 | `import { Connection, Client } from '@temporalio/client';` | COMPLEX |
| `/workspaces/cahier-des-charge/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/implementations/temporal-adapter.ts` | 2 | `import { WorkflowClient } from '@temporalio/client';` | COMPLEX |
| `/workspaces/cahier-des-charge/reports/legacy-cleanup/backup-20250420-022736/unique-agents/legacy/consolidation-2025-04-17/agents/integration/orchestrator-bridge.ts` | 1 | `import { Client as TemporalClient } from "@temporalio/client";` | COMPLEX |
| `/workspaces/cahier-des-charge/reports/migration-finalization-20250420-012655/backup/docs/agents/orchestrator-bridge.ts` | 2 | `import { Client as TemporalClient } from "@temporalio/client";` | COMPLEX |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/adapters/temporal-adapter.ts` | 17 | `import { Connection, Client, WorkflowClient } from '@temporalio/client';` | COMPLEX |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/adapters/temporal-adapter.ts` | 217 | `const handle = await this.client.workflow.start(temporalDefinition.workflowId, {` | COMPLEX |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/OrchestratorBridge/orchestrator-bridge.ts` | 2 | `import { Client as TemporalClient } from "@temporalio/client";` | COMPLEX |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/legacy/consolidation-2025-04-17/packages/mcp-agents/orchestrators/bridges/orchestrator-bridge/orchestrator-bridge.ts` | 2 | `import { Client as TemporalClient } from "@temporalio/client";` | COMPLEX |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/reports/migration-finalization-20250420-012655/backup/docs/agents/orchestrator-bridge.ts` | 2 | `import { Client as TemporalClient } from "@temporalio/client";` | COMPLEX |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/src/orchestration/orchestrators/OrchestratorBridge/orchestrator-bridge.ts` | 2 | `import { Client as TemporalClient } from "@temporalio/client";` | COMPLEX |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/src/orchestration/orchestrators/orchestrator-bridge/orchestrator-bridge.ts` | 2 | `import { Client as TemporalClient } from "@temporalio/client";` | COMPLEX |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/src/temporal/testing/workflow-tester.ts` | 5 | `import { Client, Connection } from '@temporalio/client';` | COMPLEX |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/src/temporal/testing/workflow-tester.ts` | 2 | `import { Worker } from '@temporalio/worker';` | COMPLEX |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/src/temporal/testing/workflow-tester.ts` | 3 | `import { Runtime } from '@temporalio/worker';` | COMPLEX |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/src/temporal/testing/workflow-tester.ts` | 114 | `const workflowPromise = this.client.workflow.execute(workflowName, {` | COMPLEX |
| `/workspaces/cahier-des-charge/scripts/audit-orchestrators.js` | 230 | `import { Client } from '@temporalio/client';` | COMPLEX |
| `/workspaces/cahier-des-charge/scripts/audit-orchestrators.js` | 232 | `await client.workflow.start('MyWorkflow', { args: [arg1, arg2], taskQueue: 'my-queue' });` | COMPLEX |
| `/workspaces/cahier-des-charge/src/orchestration/orchestrator-adapter.ts` | 23 | `import { Client, Connection as TemporalConnection, WorkflowClient } from '@temporalio/client';` | COMPLEX |
| `/workspaces/cahier-des-charge/src/orchestration/standardized-orchestrator.ts` | 119 | `const handle = await client.workflow.start(workflowType, {` | COMPLEX |
| `/workspaces/cahier-des-charge/src/orchestration/temporal-client.ts` | 8 | `import { Connection, Client } from '@temporalio/client';` | COMPLEX |
| `/workspaces/cahier-des-charge/src/temporal/client.ts` | 1 | `import { Client } from '@temporalio/client';` | COMPLEX |
| `/workspaces/cahier-des-charge/src/temporal/client.ts` | 25 | `const handle = await client.workflow.start(workflowType, {` | COMPLEX |
| `/workspaces/cahier-des-charge/src/temporal/testing/workflow-tester.ts` | 5 | `import { Client, Connection } from '@temporalio/client';` | COMPLEX |
| `/workspaces/cahier-des-charge/src/temporal/testing/workflow-tester.ts` | 2 | `import { Worker } from '@temporalio/worker';` | COMPLEX |
| `/workspaces/cahier-des-charge/src/temporal/testing/workflow-tester.ts` | 3 | `import { Runtime } from '@temporalio/worker';` | COMPLEX |
| `/workspaces/cahier-des-charge/src/temporal/testing/workflow-tester.ts` | 114 | `const workflowPromise = this.client.workflow.execute(workflowName, {` | COMPLEX |
| `/workspaces/cahier-des-charge/src/temporal/worker.ts` | 1 | `import { Worker, NativeConnection } from '@temporalio/worker';` | COMPLEX |

## Utilisations directes de n8n

Les intégrations suivantes utilisent n8n directement et devraient être migrées vers `standardizedOrchestrator.scheduleTask` avec `TaskType.INTEGRATION`.

| Fichier | Ligne | Utilisation détectée | Classification suggérée |
|---------|-------|---------------------|--------------------------|
| `/workspaces/cahier-des-charge/scripts/audit-orchestrators.js` | 251 | `await n8nClient.triggerWorkflow({ workflowId: 'abc123', payload: data });` | INTEGRATION |
| `/workspaces/cahier-des-charge/scripts/audit-orchestrators.js` | 48 | `{ regex: /webhookUrl.*?n8n/, classification: 'INTEGRATION' },` | INTEGRATION |
| `/workspaces/cahier-des-charge/src/orchestration/standardized-orchestrator.ts` | 159 | `const integrationId = await n8nClient.triggerWorkflow({` | INTEGRATION |
| `/workspaces/cahier-des-charge/src/orchestration/standardized-orchestrator.ts` | 39 | `webhookUrl?: string;  // URL du webhook n8n à appeler` | INTEGRATION |
| `/workspaces/cahier-des-charge/src/orchestration/standardized-orchestrator.ts` | 167 | `webhookUrl: options.n8n.webhookUrl,` | INTEGRATION |

## Utilisations existantes de l'orchestrateur standardisé

Ces services utilisent déjà l'orchestrateur standardisé et peuvent servir d'exemples pour la migration.

| Fichier | Ligne | Utilisation détectée |
|---------|-------|---------------------|
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bull-board.service.ts` | 5 | `import { StandardizedOrchestratorAdapter } from '../../../../src/orchestration/adapters/bull-board-adapter';` |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bull-board.service.ts` | 24 | `new StandardizedOrchestratorAdapter('PhpAnalyzer'),` |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bull-board.service.ts` | 25 | `new StandardizedOrchestratorAdapter('js-analyzer'),` |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bull-board.service.ts` | 26 | `new StandardizedOrchestratorAdapter('migration'),` |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bull-board.service.ts` | 27 | `new StandardizedOrchestratorAdapter('verification')` |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bullmq.module.ts` | 13 | `return orchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bullmq.module.ts` | 35 | `return orchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bullmq.module.ts` | 57 | `return orchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bullmq.module.ts` | 79 | `return orchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bullmq.module.ts` | 4 | `import { StandardizedOrchestratorService } from '../../orchestration/standardized-orchestrator.service';` |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bullmq.module.ts` | 10 | `useFactory: (orchestrator: StandardizedOrchestratorService) => {` |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bullmq.module.ts` | 28 | `inject: [StandardizedOrchestratorService]` |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bullmq.module.ts` | 32 | `useFactory: (orchestrator: StandardizedOrchestratorService) => {` |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bullmq.module.ts` | 50 | `inject: [StandardizedOrchestratorService]` |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bullmq.module.ts` | 54 | `useFactory: (orchestrator: StandardizedOrchestratorService) => {` |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bullmq.module.ts` | 72 | `inject: [StandardizedOrchestratorService]` |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bullmq.module.ts` | 76 | `useFactory: (orchestrator: StandardizedOrchestratorService) => {` |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bullmq.module.ts` | 94 | `inject: [StandardizedOrchestratorService]` |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bullmq.module.ts` | 96 | `StandardizedOrchestratorService,` |
| `/workspaces/cahier-des-charge/apps/mcp-server/src/bullmq/bullmq.module.ts` | 107 | `StandardizedOrchestratorService` |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_011443/src/core/interfaces/orchestration.ts` | 110 | `scheduleTask(task: TaskDefinition, scheduledTime: Date): Promise<string>;` |
| `/workspaces/cahier-des-charge/backups/structure_optimization_20250425_012654/src/core/interfaces/orchestration.ts` | 110 | `scheduleTask(task: TaskDefinition, scheduledTime: Date): Promise<string>;` |
| `/workspaces/cahier-des-charge/config/trigger/github-to-mcp.ts` | 4 | `import { standardizedOrchestrator, TaskType } from "../src/orchestration/standardized-orchestrator";` |
| `/workspaces/cahier-des-charge/config/trigger/github-to-mcp.ts` | 70 | `const taskId = await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/config/trigger/github-to-mcp.ts` | 246 | `const taskId = await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/examples/enhanced-orchestrator-example.ts` | 1 | `import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';` |
| `/workspaces/cahier-des-charge/examples/enhanced-orchestrator-example.ts` | 75 | `const simpleTaskId = await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/examples/enhanced-orchestrator-example.ts` | 95 | `const complexTaskId = await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/examples/enhanced-orchestrator-example.ts` | 120 | `await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/examples/standardized-orchestrator-example.ts` | 8 | `import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';` |
| `/workspaces/cahier-des-charge/examples/standardized-orchestrator-example.ts` | 16 | `const simpleTaskId = await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/examples/standardized-orchestrator-example.ts` | 33 | `const complexTaskId = await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/reports/potential-agents-20250420-015853/src/core/interfaces/orchestration.ts` | 110 | `scheduleTask(task: TaskDefinition, scheduledTime: Date): Promise<string>;` |
| `/workspaces/cahier-des-charge/scripts/audit-orchestrators.js` | 51 | `{ regex: /import.*?standardizedOrchestrator/, classification: 'STANDARDIZED' },` |
| `/workspaces/cahier-des-charge/scripts/audit-orchestrators.js` | 222 | `import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';` |
| `/workspaces/cahier-des-charge/scripts/audit-orchestrators.js` | 235 | `import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';` |
| `/workspaces/cahier-des-charge/scripts/audit-orchestrators.js` | 254 | `import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';` |
| `/workspaces/cahier-des-charge/scripts/audit-orchestrators.js` | 223 | `await standardizedOrchestrator.scheduleTask('my-queue', { data: 'value' }, { taskType: TaskType.SIMPLE });` |
| `/workspaces/cahier-des-charge/scripts/audit-orchestrators.js` | 236 | `await standardizedOrchestrator.scheduleTask('MyWorkflow', { arg1, arg2 }, {` |
| `/workspaces/cahier-des-charge/scripts/audit-orchestrators.js` | 255 | `await standardizedOrchestrator.scheduleTask('integration-workflow', data, {` |
| `/workspaces/cahier-des-charge/scripts/audit-orchestrators.js` | 53 | `{ regex: /StandardizedOrchestrator/, classification: 'STANDARDIZED' },` |
| `/workspaces/cahier-des-charge/scripts/migrate-to-standardized-orchestration.js` | 60 | `guide.push(`import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';` |
| `/workspaces/cahier-des-charge/scripts/migrate-to-standardized-orchestration.js` | 79 | `guide.push(`import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';` |
| `/workspaces/cahier-des-charge/scripts/migrate-to-standardized-orchestration.js` | 102 | `guide.push(`import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';` |
| `/workspaces/cahier-des-charge/scripts/migrate-to-standardized-orchestration.js` | 255 | `report.push(`import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';` |
| `/workspaces/cahier-des-charge/scripts/migrate-to-standardized-orchestration.js` | 273 | `report.push(`import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';` |
| `/workspaces/cahier-des-charge/scripts/migrate-to-standardized-orchestration.js` | 62 | `await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/scripts/migrate-to-standardized-orchestration.js` | 81 | `await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/scripts/migrate-to-standardized-orchestration.js` | 105 | `await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/scripts/migrate-to-standardized-orchestration.js` | 257 | `await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/scripts/migrate-to-standardized-orchestration.js` | 275 | `await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/scripts/migrate-to-temporal.js` | 175 | ``orchestrationService.scheduleTask({ name: '$2', payload: $3 })`` |
| `/workspaces/cahier-des-charge/src/core/interfaces/orchestration.ts` | 110 | `scheduleTask(task: TaskDefinition, scheduledTime: Date): Promise<string>;` |
| `/workspaces/cahier-des-charge/src/modules/seo/seo.service.ts` | 6 | `import { standardizedOrchestrator, TaskType } from '../../orchestration/standardized-orchestrator';` |
| `/workspaces/cahier-des-charge/src/modules/seo/seo.service.ts` | 143 | `const auditJobId = await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/src/modules/seo/seo.service.ts` | 246 | `const auditJobId = await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/src/orchestration/adapters/bull-board-adapter.ts` | 14 | `export class StandardizedOrchestratorAdapter implements QueueAdapter {` |
| `/workspaces/cahier-des-charge/src/orchestration/examples/workflow-example.ts` | 85 | `const imageTaskId = await unifiedOrchestrator.scheduleTask({` |
| `/workspaces/cahier-des-charge/src/orchestration/examples/workflow-example.ts` | 117 | `const notificationTaskId = await unifiedOrchestrator.scheduleTask({` |
| `/workspaces/cahier-des-charge/src/orchestration/examples/workflow-example.ts` | 132 | `const reportTaskId = await unifiedOrchestrator.scheduleTask({` |
| `/workspaces/cahier-des-charge/src/orchestration/orchestrator-adapter.ts` | 100 | `scheduleTask(task: TaskDefinition): Promise<string>;` |
| `/workspaces/cahier-des-charge/src/orchestration/orchestrator-adapter.ts` | 157 | `async scheduleTask(task: TaskDefinition): Promise<string> {` |
| `/workspaces/cahier-des-charge/src/orchestration/orchestrator-adapter.ts` | 377 | `async scheduleTask(task: TaskDefinition): Promise<string> {` |
| `/workspaces/cahier-des-charge/src/orchestration/orchestrator-adapter.ts` | 554 | `async scheduleTask(task: TaskDefinition): Promise<string> {` |
| `/workspaces/cahier-des-charge/src/orchestration/orchestrator-adapter.ts` | 784 | `async scheduleTask(task: TaskDefinition): Promise<string> {` |
| `/workspaces/cahier-des-charge/src/orchestration/orchestrator-adapter.ts` | 789 | `return await orchestrator.scheduleTask(task);` |
| `/workspaces/cahier-des-charge/src/orchestration/orchestrator-adapter.ts` | 800 | `return await orchestrator.scheduleTask(task);` |
| `/workspaces/cahier-des-charge/src/orchestration/orchestrator-adapter.ts` | 789 | `return await orchestrator.scheduleTask(task);` |
| `/workspaces/cahier-des-charge/src/orchestration/orchestrator-adapter.ts` | 800 | `return await orchestrator.scheduleTask(task);` |
| `/workspaces/cahier-des-charge/src/orchestration/standardized-orchestrator.service.ts` | 2 | `import { standardizedOrchestrator, StandardizedTaskOptions, TaskType } from './standardized-orchestrator';` |
| `/workspaces/cahier-des-charge/src/orchestration/standardized-orchestrator.service.ts` | 17 | `async scheduleTask(taskName: string, payload: any, options: StandardizedTaskOptions): Promise<string> {` |
| `/workspaces/cahier-des-charge/src/orchestration/standardized-orchestrator.service.ts` | 18 | `return standardizedOrchestrator.scheduleTask(taskName, payload, options);` |
| `/workspaces/cahier-des-charge/src/orchestration/standardized-orchestrator.service.ts` | 25 | `return standardizedOrchestrator.scheduleTask(taskName, payload, {` |
| `/workspaces/cahier-des-charge/src/orchestration/standardized-orchestrator.service.ts` | 35 | `return standardizedOrchestrator.scheduleTask(taskName, payload, {` |
| `/workspaces/cahier-des-charge/src/orchestration/standardized-orchestrator.service.ts` | 45 | `return standardizedOrchestrator.scheduleTask(taskName, payload, {` |
| `/workspaces/cahier-des-charge/src/orchestration/standardized-orchestrator.service.ts` | 9 | `export class StandardizedOrchestratorService {` |
| `/workspaces/cahier-des-charge/src/orchestration/standardized-orchestrator.ts` | 65 | `async scheduleTask(taskName: string, payload: any, options: StandardizedTaskOptions): Promise<string> {` |
| `/workspaces/cahier-des-charge/src/orchestration/standardized-orchestrator.ts` | 99 | `return unifiedOrchestrator.scheduleTask(taskDefinition);` |
| `/workspaces/cahier-des-charge/src/orchestration/standardized-orchestrator.ts` | 142 | `await unifiedOrchestrator.scheduleTask(trackingTask);` |
| `/workspaces/cahier-des-charge/src/orchestration/standardized-orchestrator.ts` | 61 | `export class StandardizedOrchestrator {` |
| `/workspaces/cahier-des-charge/src/orchestration/standardized-orchestrator.ts` | 288 | `export const standardizedOrchestrator = new StandardizedOrchestrator();` |
| `/workspaces/cahier-des-charge/src/orchestration/unified-orchestrator.ts` | 133 | `async scheduleTask(task: TaskDefinition): Promise<string> {` |
| `/workspaces/cahier-des-charge/src/temporal/worker.ts` | 3 | `import { standardizedOrchestrator } from '../orchestration/standardized-orchestrator';` |
| `/workspaces/cahier-des-charge/src/temporal/worker.ts` | 47 | `await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/src/temporal/worker.ts` | 65 | `await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/tests/integration/orchestration-e2e.integration.test.ts` | 8 | `import { standardizedOrchestrator, TaskType } from '../../src/orchestration/standardized-orchestrator';` |
| `/workspaces/cahier-des-charge/tests/integration/orchestration-e2e.integration.test.ts` | 107 | `const analysisTaskId = await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/tests/integration/orchestration-e2e.integration.test.ts` | 148 | `const migrationWorkflowId = await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/tests/integration/orchestration-e2e.integration.test.ts` | 216 | `const workflowId = await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/tests/integration/orchestration-e2e.integration.test.ts` | 253 | `standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/tests/integration/orchestration-e2e.integration.test.ts` | 302 | `const analysisTaskId = await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/tests/integration/orchestration-e2e.integration.test.ts` | 309 | `const migrationWorkflowId = await standardizedOrchestrator.scheduleTask(` |
| `/workspaces/cahier-des-charge/tests/integration/standardized-orchestrator.integration.test.ts` | 8 | `import { standardizedOrchestrator, TaskType } from '../../src/orchestration/standardized-orchestrator';` |
| `/workspaces/cahier-des-charge/tests/integration/standardized-orchestrator.integration.test.ts` | 66 | `const taskId = await standardizedOrchestrator.scheduleTask(taskName, payload, options);` |
| `/workspaces/cahier-des-charge/tests/integration/standardized-orchestrator.integration.test.ts` | 121 | `const workflowId = await standardizedOrchestrator.scheduleTask(taskName, payload, options);` |
| `/workspaces/cahier-des-charge/tests/integration/standardized-orchestrator.integration.test.ts` | 144 | `const workflowId = await standardizedOrchestrator.scheduleTask(taskName, payload, options);` |
| `/workspaces/cahier-des-charge/tests/integration/standardized-orchestrator.integration.test.ts` | 202 | `standardizedOrchestrator.scheduleTask(taskName, payload, options)` |
| `/workspaces/cahier-des-charge/tests/integration/standardized-orchestrator.integration.test.ts` | 245 | `const taskId = await service.scheduleTask(taskName, payload, options);` |
| `/workspaces/cahier-des-charge/tests/integration/standardized-orchestrator.integration.test.ts` | 227 | `const { StandardizedOrchestratorService } = require('../../src/orchestration/standardized-orchestrator.service');` |
| `/workspaces/cahier-des-charge/tests/integration/standardized-orchestrator.integration.test.ts` | 230 | `const service = new StandardizedOrchestratorService();` |

## Recommandations pour la migration

1. **Étape 1**: Commencer par migrer les cas d'utilisation BullMQ simples vers l'orchestrateur standardisé
2. **Étape 2**: Migrer ensuite les workflows Temporal complexes
3. **Étape 3**: Finaliser avec les intégrations n8n

### Exemple de migration pour BullMQ

```typescript
// Avant
import { Queue } from 'bullmq';
const queue = new Queue('my-queue');
await queue.add('my-job', { data: 'value' });

// Après
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';
await standardizedOrchestrator.scheduleTask('my-queue', { data: 'value' }, { taskType: TaskType.SIMPLE });
```

### Exemple de migration pour Temporal

```typescript
// Avant
import { Client } from '@temporalio/client';
const client = new Client();
await client.workflow.start('MyWorkflow', { args: [arg1, arg2], taskQueue: 'my-queue' });

// Après
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';
await standardizedOrchestrator.scheduleTask('MyWorkflow', { arg1, arg2 }, { 
  taskType: TaskType.COMPLEX,
  temporal: {
    workflowType: 'MyWorkflow',
    workflowArgs: [arg1, arg2],
    taskQueue: 'my-queue'
  }
});
```

### Exemple de migration pour n8n

```typescript
// Avant
import { n8nClient } from '../integration/n8n-client';
await n8nClient.triggerWorkflow({ workflowId: 'abc123', payload: data });

// Après
import { standardizedOrchestrator, TaskType } from '../src/orchestration/standardized-orchestrator';
await standardizedOrchestrator.scheduleTask('integration-workflow', data, { 
  taskType: TaskType.INTEGRATION,
  n8n: {
    workflowId: 'abc123'
  }
});
```
