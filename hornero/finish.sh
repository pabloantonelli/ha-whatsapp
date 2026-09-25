#!/usr/bin/with-contenv bashio

COMPONENT_DIR="/config/custom_components/hornero"

rm -rf "${COMPONENT_DIR}"

# Remove the parent directory only when this add-on left it empty.
if [ -d /config/custom_components ] && [ -z "$(ls -A /config/custom_components)" ]; then
    rmdir /config/custom_components
fi

bashio::log.info "Uninstalled the Hornero integration."
