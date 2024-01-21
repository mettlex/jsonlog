import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { secureHeaders } from "hono/secure-headers";
import pino from "pino";
import { z } from "zod";

import { getResultAsync, getResultSync } from "./utils/result";
import { sendSlackWebhook } from "./utils/slack";

const app = new Hono();

app.use("*", secureHeaders());
app.use("*", compress());

const bodySchema = z
  .string()
  .nullable()
  .refine((val) => (val || "").length <= 1024 * 1024 * 10, {
    message: "body can't be more than 10 MB",
  })
  .transform((x) => (x ? JSON.parse(x) : null));

const log = pino();

app.post("/", async (c) => {
  log.info(`length: ${c.req.header("content-length")}`);

  const bodyResult = await getResultAsync(() => c.req.text());

  if (bodyResult.isErr) {
    log.error(bodyResult.error, "body error");

    return c.json({
      success: false,
      message: "error reading request body",
    });
  }

  const slackResult = await getResultAsync(() =>
    sendSlackWebhook(bodyResult.value),
  );

  if (slackResult.isErr) {
    log.error(slackResult.error, "slack error");
  }

  const validationResult = getResultSync(() =>
    bodySchema.parse(bodyResult.value),
  );

  if (validationResult.isErr) {
    log.error(validationResult.error, "validation error");

    return c.json({
      success: false,
      message: validationResult.error.message,
    });
  }

  const body = validationResult.value;

  log.info(body, "body");

  const message = slackResult.isErr
    ? slackResult.error.message
    : "successfully logged";

  return c.json({
    success: true,
    message,
  });
});

const port = +(process.env.PORT || "5987");

console.log(`listening on port http://localhost:${port}`);

serve({
  port,
  fetch: app.fetch,
});
