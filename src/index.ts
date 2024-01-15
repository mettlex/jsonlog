import { Hono } from "hono";
import { compress } from "hono/compress";
import { secureHeaders } from "hono/secure-headers";
import pino from "pino";
import { z } from "zod";

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
  try {
    log.info(`length: ${c.req.header("content-length")}`);

    const body = await c.req.text();
    const validatedBody = bodySchema.parse(body);

    log.info(validatedBody, "body");

    return c.json({
      success: true,
    });
  } catch (error) {
    log.error(error);
    return c.json({
      success: false,
    });
  }
});

export default {
  port: process.env.PORT || 5987,
  fetch: app.fetch,
};
