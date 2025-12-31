#!/usr/bin/with-contenv bashio
set +u

# Get the add-on slug and convert underscores to hyphens for valid DNS hostname
# Home Assistant add-ons use slug with underscores replaced by hyphens
# Example: whatsapp_addon becomes whatsapp-addon
ADDON_SLUG="whatsapp-addon"
ADDON_PORT="3000"

# Build the add-on URL
ADDON_URL="http://${ADDON_SLUG}:${ADDON_PORT}"

# Update hostname in custom component if file exists
if [ -f "/custom_component/whatsapp.py" ]; then
    bashio::log.info "Configuring custom component with add-on URL: $ADDON_URL"
    sed -i "s|http://{{HOSTNAME}}:3000|$ADDON_URL|g" /custom_component/whatsapp.py
    bashio::log.info "Updated custom component to use: $ADDON_URL"
fi

# Install custom component to Home Assistant
mkdir -p /config/custom_components/whatsapp
cp --recursive /custom_component/* /config/custom_components/whatsapp/
bashio::log.info "Installed custom component."

# Start the WhatsApp add-on
bashio::log.info "Starting WhatsApp add-on v2.0.0..."
cd /
node index.js