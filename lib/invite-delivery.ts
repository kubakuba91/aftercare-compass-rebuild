// Delivery failures must not undo a completed account setup.
export async function deliverInvitations(
  emails: string[],
  send: (email: string) => Promise<{ status: string }>
) {
  const results = await Promise.allSettled(emails.map(email => Promise.resolve().then(() => send(email))));
  const sent = results.filter(result => result.status === "fulfilled" && result.value.status === "sent").length;
  return { sent, notSent: emails.length - sent };
}
