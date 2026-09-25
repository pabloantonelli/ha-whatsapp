#!/usr/bin/with-contenv bashio
set -e

COMPONENT_DIR="/config/custom_components/hornero"

bashio::log.info "Installing the Hornero integration into Home Assistant..."

# Replace the whole directory: the integration ships subfolders (translations,
# brand) and a stale file from an older version would break the import.
rm -rf "${COMPONENT_DIR}"
mkdir -p "${COMPONENT_DIR}"
cp -r /custom_component/. "${COMPONENT_DIR}/"

bashio::log.info "Integration installed in ${COMPONENT_DIR}"
bashio::log.notice "Restart Home Assistant Core on a first install, so the integration is loaded."

cd /app
exec node src/server.js
