import { Worker, Processor, WorkerOptions } from 'bullmq';
import { logger, ctx, addCounter } from '@takaro/util';
import { getRedisConnectionOptions } from './util/redisConnectionOptions.js';

type WorkerOptionsWithoutConnectionOptions = Omit<WorkerOptions, 'connection'>;

export abstract class TakaroWorker<T> {
  log = logger('worker');
  public bullWorker: Worker<T, unknown>;

  constructor(
    name: string,
    concurrency = 1,
    fn: Processor<T, unknown>,
    extraBullOpts: WorkerOptionsWithoutConnectionOptions = {},
  ) {
    const label = `worker:${name}`;

    const instrumentedProcessor = ctx.wrap(
      label,
      addCounter(fn, {
        name: label,
        help: `How many jobs were processed by ${name}`,
      }),
    );

    this.bullWorker = new Worker(name, instrumentedProcessor as Processor, {
      connection: getRedisConnectionOptions(),
      concurrency,
      removeOnComplete: { count: 10 },
      removeOnFail: { count: 10 },
      ...extraBullOpts,
    });

    this.bullWorker.on('failed', (job, err) => {
      if (job) {
        this.log.error(`Job ${job.id} failed: ${err.message}`);
      } else {
        this.log.error(`Job failed: ${err.message}`);
      }
    });

    this.bullWorker.on('completed', (job) => {
      this.log.debug(`Job ${job.id} completed`);
    });

    this.bullWorker.on('stalled', (jobId, prev) => {
      this.log.warn(`Job ${jobId} stalled`, { worker: name, jobId, previousState: prev });
    });

    // Handle worker-level errors
    this.bullWorker.on('error', (err) => {
      this.log.error('Worker error', { error: err.message, worker: name });
    });

    // Handle Redis connection issues - exit to get clean restart
    // When Redis disconnects and reconnects, BullMQ workers can get stuck with
    // "ghost" active jobs where lock extension resumes but job processor promises
    // remain stuck. Exiting allows Docker to restart with clean state.
    this.bullWorker.on('ioredis:close', () => {
      this.log.error('Redis connection closed - exiting worker for clean restart', { worker: name });
      // Give time for logs to flush, then exit
      setTimeout(() => process.exit(1), 1000);
    });
  }
}
