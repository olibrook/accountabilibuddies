#!/usr/bin/env -S npx tsx

import { $ } from "execa";
import { Command } from "commander";
import p from "path";
import { cloneDeep } from "lodash";

const root = p.resolve(p.join(__dirname, "..", ".."));
const program = new Command();

program.name("cli");

program.command("deploy").action(async () => {
  const sh = $({
    stdio: "inherit",
    shell: true,
    cwd: root,
    env: {
      ...cloneDeep(process.env),
      DOCKER_DEFAULT_PLATFORM: "linux/amd64",
    },
  });
  await sh`docker compose build`;
  await sh`docker push us-central1-docker.pkg.dev/accountabilibuddies-409618/accountabilibuddies-web/accountabilibuddies-web:latest`;
  await sh`gcloud run deploy --quiet --project accountabilibuddies-409618 --image us-central1-docker.pkg.dev/accountabilibuddies-409618/accountabilibuddies-web/accountabilibuddies-web:latest --port 3000 accountabilibuddies-web --region us-central1`;
});

program.parse(process.argv);
