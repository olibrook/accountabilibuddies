#!/usr/bin/env -S npx tsx

import { $ } from "execa";
import { Command, Option } from "commander";
import p from "path";
import { cloneDeep } from "lodash";

const root = p.resolve(p.join(__dirname, "..", ".."));
const program = new Command();

enum Env {
  Prod = "prod",
  Local = "local",
}

const envArray = Object.values(Env);

const fail = () => {
  throw new Error("Fail");
};

const getDBConnectionString = async (env: Env): Promise<string> => {
  switch (env) {
    case Env.Local: {
      return "postgresql://postgres:postgres@localhost:5432/buds";
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
  .command("db-shell")
  .description("Open a PSQL shell")
  .addOption(
    new Option("--env <env>", "The env to connect to")
      .default("local")
      .choices(envArray),
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

const checkDeps = async () => {
  const progs = ["docker", "doctl", "psql"];
  for (const prog of progs) {
    const { stdout } = await $`which ${prog}`;
    console.log(stdout);
  }
};

void Promise.resolve()
  .then(checkDeps)
  .then(() => program.parse(process.argv));
