#!/bin/bash
set -e

FRANKFURTER_CLIENT_DIR="src/clients/frankfurter/client"

if [ ! -d "$FRANKFURTER_CLIENT_DIR" ]; then
  echo "Frankfurter client not found. Generating from OpenAPI definition..."
  npx @openapitools/openapi-generator-cli generate
  echo "Frankfurter client generated successfully."
else
  echo "Frankfurter client already exists, skipping generation."
fi
