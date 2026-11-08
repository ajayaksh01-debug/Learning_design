import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { DEFAULT_USER_EMAIL } from "../src/lib/constants";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

type SeedQuiz = {
  question: string;
  options: string[] | null;
  answer: string;
  explanation: string;
};

type SeedStop = {
  order: number;
  title: string;
  estMinutes: number;
  contentMd: string;
  quiz: SeedQuiz[];
  artifactPrompt: string;
};

type SeedModule = {
  stageSlug: string;
  stageTitle: string;
  stageDescription: string;
  stageOrder: number;
  slug: string;
  title: string;
  order: number;
  stops: SeedStop[];
};

async function main() {
  const user = await db.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: {},
    create: { email: DEFAULT_USER_EMAIL },
  });
  console.log(`User ready: ${user.email} (${user.id})`);

  const seedDir = join(__dirname, "..", "content", "seed");
  const files = readdirSync(seedDir).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.warn(`No seed files found in ${seedDir}`);
  }

  for (const file of files) {
    const raw = readFileSync(join(seedDir, file), "utf-8");
    const mod: SeedModule = JSON.parse(raw);

    const stageRow = await db.stage.upsert({
      where: { slug: mod.stageSlug },
      update: {
        title: mod.stageTitle,
        description: mod.stageDescription,
        order: mod.stageOrder,
      },
      create: {
        slug: mod.stageSlug,
        title: mod.stageTitle,
        description: mod.stageDescription,
        order: mod.stageOrder,
      },
    });

    const moduleRow = await db.module.upsert({
      where: { slug: mod.slug },
      update: { title: mod.title, order: mod.order, stageId: stageRow.id },
      create: {
        slug: mod.slug,
        title: mod.title,
        order: mod.order,
        stageId: stageRow.id,
      },
    });

    // Clear existing stops for this module so re-seeding is idempotent
    // (stops have no natural unique key other than moduleId+order).
    await db.stop.deleteMany({ where: { moduleId: moduleRow.id } });

    for (const s of mod.stops) {
      const stopRow = await db.stop.create({
        data: {
          moduleId: moduleRow.id,
          order: s.order,
          title: s.title,
          estMinutes: s.estMinutes,
          contentMd: s.contentMd,
          artifactPrompt: s.artifactPrompt,
        },
      });

      for (const q of s.quiz) {
        await db.quizItem.create({
          data: {
            stopId: stopRow.id,
            question: q.question,
            options: q.options ? JSON.stringify(q.options) : null,
            answer: q.answer,
            explanation: q.explanation,
          },
        });
      }
    }

    console.log(`Seeded module "${mod.slug}" with ${mod.stops.length} stops`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
