#!/usr/bin/with-contenv bashio
set -e

COMPONENT_DIR="/config/custom_components/whatsapp"

bashio::log.info "Installing the WhatsApp custom component into Home Assistant..."

mkdir -p "${COMPONENT_DIR}"

# Only the component sources are copied. The endpoint the component talks to is
# written by the add-on itself at startup (see src/component.js), so there is no
# need to rewrite any source file with an IP address, as earlier versions did.
cp -f /custom_component/*.py /custom_component/*.yaml /custom_component/*.json "${COMPONENT_DIR}/"

bashio::log.info "Custom component installed in ${COMPONENT_DIR}"
bashio::log.notice "Restart Home Assistant Core if this is the first install, so the component is loaded."

cd /app
exec node src/server.js
