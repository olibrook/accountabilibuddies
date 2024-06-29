#!/usr/bin/env -S npx tsx

import { $, execa } from "execa";
import { Command, Option } from "commander";
import p from "path";
import { cloneDeep } from "lodash";
import { PrismaClient } from "@prisma/client";
import { convertWeight } from "@buds/shared/utils";

const root = p.resolve(p.join(__dirname, ".."));

const checkDeps = async () => {
  const progs = ["docker", "doctl", "psql"];
  for (const prog of progs) {
    try {
      await $`which ${prog}`;
    } catch (e) {
      throw new Error(
        `This script depends on "${prog}", which isn't installed.`,
      );
    }
  }
};

enum Env {
  Prod = "prod",
  Local = "local",
  Test = "test",
}

const envChoices = Object.values(Env);

const fail = () => {
  throw new Error("Fail");
};

const getDBConnectionString = async (env: Env): Promise<string> => {
  switch (env) {
    case Env.Local: {
      return "postgresql://postgres:postgres@localhost:5432/buds";
    }
    case Env.Test: {
      return "postgresql://postgres:postgres@localhost:5432/test";
    }
    case Env.Prod: {
      const { stdout } =
        await $`doctl databases user get 74b57314-990e-4028-b728-3fca04e867cb doadmin --output json`;
      const res = JSON.parse(stdout) as Array<{ password: string }>;
      const password = res[0]?.password ?? fail();
      return `postgresql://doadmin:${password}@honey-nut-do-user-17029447-0.c.db.ondigitalocean.com:25060/buds-prod?sslmode=require`;
    }
  }
};

const program = new Command();

program.name("cli");

program
  .command("deploy")
  .description("Build the docker image and deploy")
  .action(async () => {
    const sh = $({
      stdio: "inherit",
      shell: true,
      cwd: root,
      env: {
        ...cloneDeep(process.env),
        DOCKER_DEFAULT_PLATFORM: "linux/amd64",
      },
    });
    // Pushing the image triggers a digital ocean deploy automatically.
    await sh`docker compose build`;
    await sh`docker push registry.digitalocean.com/imagez/accountabilibuddies-web:latest`;
  });

program
  .command("db-url")
  .description("Open a PSQL shell")
  .addOption(
    new Option("--env <env>", "The env to connect to")
      .default("local")
      .choices(envChoices),
  )
  .action(async ({ env }: { env: Env }) => {
    const connectionString = await getDBConnectionString(env);
    console.log(connectionString);
  });

program
  .command("db-shell")
  .description("Open a PSQL shell")
  .addOption(
    new Option("--env <env>", "The env to connect to")
      .default("local")
      .choices(envChoices),
  )
  .action(async ({ env }: { env: Env }) => {
    const sh = $({
      stdio: "inherit",
      shell: false,
    });
    const connectionString = await getDBConnectionString(env);
    const subprocess = sh`psql --dbname ${connectionString}`;

    process.on("SIGINT", () => {
      subprocess.kill("SIGHUP"); // Exits psql cleanly
    });
  });

program
  .command("prisma")
  .description("A wrapper around prisma")
  .addOption(
    new Option("--env <env>", "The env to connect to")
      .default("local")
      .choices(envChoices),
  )
  .allowUnknownOption() // Allow arg forwarding
  .helpOption(false) // Let prisma handle --help
  .action(async ({ env }: { env: Env }, program: Command) => {
    // Anything not captured by the args to the wrapper gets forwarded to prisma
    const prismaArgs = program.args;
    const prismaEnv = {
      ...process.env,
      DATABASE_URL: await getDBConnectionString(env),
    };

    await execa("prisma", prismaArgs, {
      stdio: "inherit",
      env: prismaEnv,
      preferLocal: true,
    });
  });

program
  .command("data-migrations")
  .description("Run data (not schema) migrations")
  .addOption(
    new Option("--env <env>", "The env to connect to")
      .default("local")
      .choices(envChoices),
  )
  .action(async ({ env }: { env: Env }) => {
    const datasourceUrl = await getDBConnectionString(env);
    const db = new PrismaClient({ datasourceUrl });
    const users = await db.user.findMany({
      include: { tracks: { include: { stats: true } } },
    });

    for (const user of users) {
      for (const track of user.tracks) {
        if (track.name === "weight" && !user.useMetric) {
          for (const stat of track.stats) {
            const value = convertWeight(stat.value, "imperial", "metric");
            console.log(
              JSON.stringify({ where: { id: stat.id }, data: { value } }),
            );
          }
        }
      }
    }
  });

void Promise.resolve()
  .then(checkDeps)
  .then(() => program.parse(process.argv));
