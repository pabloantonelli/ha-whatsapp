#!/usr/bin/with-contenv bashio
set +u

# Get the add-on slug from the config
ADDON_SLUG=$(bashio::addon.slug)

# Update hostname in custom component if file exists
# Use the add-on slug for reliable internal communication in Home Assistant
if [ -f "/custom_component/whatsapp.py" ]; then
    bashio::log.info "Configuring custom component with add-on slug: $ADDON_SLUG"
    sed -i "s/{{HOSTNAME}}/$ADDON_SLUG/g" /custom_component/whatsapp.py
    bashio::log.info "Updated custom component hostname to: $ADDON_SLUG"
fi

# Install custom component to Home Assistant
mkdir -p /config/custom_components/whatsapp
cp --recursive /custom_component/* /config/custom_components/whatsapp/
bashio::log.info "Installed custom component."

# Start the WhatsApp add-on
bashio::log.info "Starting WhatsApp add-on v2.0.0..."
cd /
node index.js