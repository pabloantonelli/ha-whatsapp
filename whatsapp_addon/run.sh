#!/usr/bin/with-contenv bashio
set +u

bashio::log.info "=========================================="
bashio::log.info "WhatsApp Add-on Network Configuration"
bashio::log.info "=========================================="

# Get the add-on's own IP address using bashio
ADDON_IP=$(bashio::addon.ip_address)
ADDON_PORT="3000"
ADDON_URL="http://${ADDON_IP}:${ADDON_PORT}"

bashio::log.info "Add-on IP Address: $ADDON_IP"
bashio::log.info "Add-on Port: $ADDON_PORT"
bashio::log.info "Add-on URL: $ADDON_URL"
bashio::log.info "Container Hostname: $HOSTNAME"

# Update hostname in custom component if file exists
if [ -f "/custom_component/whatsapp.py" ]; then
    bashio::log.info "Updating custom component file..."
    
    # Show current content (for debug)
    CURRENT_HOST=$(grep "HOST =" /custom_component/whatsapp.py)
    bashio::log.info "Current HOST line: $CURRENT_HOST"
    
    # Robust replacement: replace whatever is between quotes in HOST = '...'
    sed -i "s|HOST = '.*'|HOST = '$ADDON_URL'|g" /custom_component/whatsapp.py
    
    # Verify update
    UPDATED_HOST=$(grep "HOST =" /custom_component/whatsapp.py)
    bashio::log.info "Updated HOST line: $UPDATED_HOST"
    
    if [[ "$UPDATED_HOST" == *"$ADDON_IP"* ]]; then
        bashio::log.info "✅ Variable HOST updated correctly with IP $ADDON_IP"
    else
        bashio::log.error "❌ Failed to update HOST variable!"
    fi
else
    bashio::log.error "❌ Source file NOT FOUND at /custom_component/whatsapp.py"
fi

# Install custom component to Home Assistant
bashio::log.info "Installing custom component to /config/custom_components/whatsapp/"
mkdir -p /config/custom_components/whatsapp
cp --recursive /custom_component/* /config/custom_components/whatsapp/
bashio::log.info "✅ Custom component files copied"

# Verify the installed component
if [ -f "/config/custom_components/whatsapp/whatsapp.py" ]; then
    INSTALLED_HOST=$(grep "HOST =" /config/custom_components/whatsapp/whatsapp.py)
    bashio::log.info "Final verification in /config: $INSTALLED_HOST"
    bashio::log.info "✅ Custom component installed and verified"
else
    bashio::log.error "❌ Custom component NOT FOUND in /config after copy!"
fi

bashio::log.info "=========================================="
bashio::log.info "Starting WhatsApp Add-on"
bashio::log.info "=========================================="
bashio::log.info "Add-on will be accessible at: $ADDON_URL"
bashio::log.info "Home Assistant should connect to: $ADDON_URL"
bashio::log.info "=========================================="

# Start the WhatsApp add-on
cd /
node index.js