import { z } from "zod";
import { getBoss } from "@/queue/pgboss";
import { QUEUE_NAMES } from "@/queue/queues";

export const triggerScrapeSchema = z.object({
  source: z.enum(["linkedin", "naukri", "indeed"]),
  role: z.string().min(1).default("software engineer"),
  location: z.string().min(1).default("india"),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type TriggerScrapeBody = z.infer<typeof triggerScrapeSchema>;

export const ScrapeService = {
  trigger: async (body: TriggerScrapeBody) => {
    const jobId = await getBoss().send(QUEUE_NAMES.SCRAPE, body, { priority: 1 });
    return { queued: true, jobId };
  },
};
