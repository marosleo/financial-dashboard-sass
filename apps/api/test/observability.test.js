const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  resolveRequestId,
} = require("../dist/common/observability/request-id.js");
const {
  PluggyWebhookQueueService,
  webhookRetryDelayMs,
} = require("../dist/modules/pluggy/pluggy-webhook-queue.service.js");

test("preserves safe request IDs and replaces unsafe values", () => {
  assert.equal(resolveRequestId("trace-123"), "trace-123");
  assert.match(resolveRequestId("unsafe value\n"), /^[0-9a-f-]{36}$/);
  assert.match(resolveRequestId(undefined), /^[0-9a-f-]{36}$/);
});

test("uses capped exponential backoff for webhook retries", () => {
  assert.equal(webhookRetryDelayMs(1), 1000);
  assert.equal(webhookRetryDelayMs(2), 2000);
  assert.equal(webhookRetryDelayMs(5), 16000);
  assert.equal(webhookRetryDelayMs(20), 60000);
});

test("durable worker atomically claims and completes a persisted event", async () => {
  const event = {
    id: "event-record-1",
    pluggyEventId: "provider-event-1",
    payload: { event: "item/deleted", eventId: "provider-event-1" },
    attempts: 0,
    status: "PENDING",
  };
  const prisma = {
    pluggyWebhookEvent: {
      findMany: async () => [{ id: event.id }],
      updateMany: async ({ data }) => {
        event.status = data.status;
        event.attempts += data.attempts.increment;
        return { count: 1 };
      },
      findUniqueOrThrow: async () => event,
      update: async ({ data }) => Object.assign(event, data),
    },
  };
  let processed = false;
  const sync = {
    processWebhookPayload: async () => {
      processed = true;
    },
  };
  const queue = new PluggyWebhookQueueService(prisma, sync);

  await queue.drain();

  assert.equal(processed, true);
  assert.equal(event.attempts, 1);
  assert.equal(event.status, "PROCESSED");
});
