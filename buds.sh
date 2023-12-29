#!/bin/bash
set -euxo pipefail

# Deploying to GCloudl, not a mac!
export DOCKER_DEFAULT_PLATFORM=linux/amd64

# Deploy
docker compose build
docker push us-central1-docker.pkg.dev/accountabilibuddies-409618/accountabilibuddies-web/accountabilibuddies-web:latest

gcloud run deploy --project accountabilibuddies-409618 --image us-central1-docker.pkg.dev/accountabilibuddies-409618/accountabilibuddies-web/accountabilibuddies-web:latest --port 3000