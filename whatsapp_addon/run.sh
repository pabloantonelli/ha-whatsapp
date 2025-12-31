#!/usr/bin/with-contenv bashio
set +u

# Update hostname in custom component if file exists
if [ -f "/custom_component/whatsapp.py" ]; then
    sed -i "s/{{HOSTNAME}}/$HOSTNAME/g" /custom_component/whatsapp.py
    bashio::log.info "Updated custom component hostname."
fi

# Install custom component to Home Assistant
mkdir -p /config/custom_components/whatsapp
cp --recursive /custom_component/* /config/custom_components/whatsapp/
bashio::log.info "Installed custom component."

# Start the WhatsApp add-on
bashio::log.info "Starting WhatsApp add-on v2.0.0..."
cd /
node index.js