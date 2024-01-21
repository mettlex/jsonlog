export async function sendSlackWebhook(data: string) {
  const response = await fetch(process.env.SLACK_WEBHOOK_URL || "", {
    method: "POST",
    body: JSON.stringify({
      text: data,
    }),
  });

  if (!response.ok) {
    throw new Error((await response.text()) || "Error sending Slack webhook");
  }

  return response.text();
}
