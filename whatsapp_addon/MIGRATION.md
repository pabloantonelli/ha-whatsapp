# Migration Guide: v1.5.0 → v2.0.0

## Overview

Version 2.0.0 is a major update that migrates from Baileys 6.7.12 to Baileys 7.0.0-rc.9, bringing significant improvements in stability, security, and performance.

## Breaking Changes

### 1. Re-authentication Required

**Important:** You will need to scan the QR code again after upgrading.

- Session data from v1.5.0 is **not compatible** with v2.0.0
- The authentication process remains the same (scan QR code from notifications)
- Your old session will be automatically cleaned up

### 2. Internal Architecture Changes

The add-on has been completely rewritten using:
- **ESM (ES Modules)** instead of CommonJS
- **Baileys 7.0.0-rc.9** with LID support
- **Improved error handling** with async/await throughout
- **Updated dependencies** to latest versions

## What's New

### Enhanced Features

1. **LID Support**
   - Full support for Linked Device Identifiers
   - Better multi-device synchronization
   - Improved message delivery reliability

2. **Meta Coexistence**
   - Compatible with accounts using Meta Business API
   - Can send/receive messages from Meta API users
   - Works in groups with Meta API users

3. **Performance Improvements**
   - 80% reduction in bundle size
   - Faster message processing
   - Reduced memory footprint
   - Better connection stability

4. **Security Enhancements**
   - Removed automatic ACKs to reduce ban risk
   - Better protocol compliance with WhatsApp Web
   - Improved encryption handling

5. **New Health Check Endpoint**
   - Monitor add-on status via `/health` endpoint
   - Check connection status of all clients
   - Useful for automation and monitoring

## Migration Steps

### Step 1: Backup Your Configuration

Before upgrading, note down your current configuration:

```yaml
# Your current configuration in configuration.yaml
whatsapp:
```

### Step 2: Update the Add-on

1. Go to **Supervisor** → **Add-on Store**
2. Find **Whatsapp** add-on
3. Click **Update**
4. Wait for the update to complete

### Step 3: Restart the Add-on

1. Go to the **Whatsapp** add-on page
2. Click **Restart**
3. Wait for the add-on to start

### Step 4: Re-authenticate

1. Check your **Notifications** in Home Assistant
2. You should see a new QR code notification
3. Open WhatsApp on your phone
4. Go to **Settings** → **Linked Devices**
5. Tap **Link a Device**
6. Scan the QR code from the notification

### Step 5: Verify Connection

After scanning the QR code:

1. The notification should disappear automatically
2. Check the add-on logs for "client is ready" message
3. Test sending a message using the service

## Testing Your Setup

### Test Message Service

Use the Developer Tools to test sending a message:

```yaml
service: whatsapp.send_message
data:
  clientId: default
  to: "+1234567890"
  body:
    text: "Test message from Home Assistant v2.0.0"
```

### Check Health Status

You can check the add-on health by accessing:
```
http://homeassistant.local:3000/health
```

This will return:
```json
{
  "status": "OK",
  "version": "2.0.0",
  "baileys": "7.0.0-rc.9",
  "clients": {
    "default": {
      "connected": true
    }
  }
}
```

## API Compatibility

### ✅ Fully Compatible

All existing API endpoints remain the same:

- `/sendMessage` - Send messages
- `/setStatus` - Update profile status
- `/presenceSubscribe` - Subscribe to user presence
- `/sendPresenceUpdate` - Send presence update
- `/sendInfinityPresenceUpdate` - Send continuous presence updates

### ✨ New Endpoints

- `/health` - Health check and status monitoring

## Common Issues

### Issue: QR Code Not Appearing

**Solution:**
1. Check add-on logs for errors
2. Restart the add-on
3. Clear browser cache and refresh Home Assistant

### Issue: "Client not found" Error

**Solution:**
1. Verify your `clientId` in the service call
2. Check that the client is configured in add-on options
3. Restart the add-on if needed

### Issue: Messages Not Sending

**Solution:**
1. Verify the phone number format (include country code)
2. Check that the recipient is on WhatsApp
3. Ensure the client is connected (check `/health` endpoint)
4. Review add-on logs for specific errors

### Issue: Frequent Disconnections

**Solution:**
1. This is normal during the first few hours after authentication
2. The add-on will automatically reconnect
3. If it persists, try re-authenticating
4. Consider reducing message frequency

## Best Practices

### 1. Avoid Bans

- Don't send too many messages in a short time
- Avoid sending identical messages to multiple recipients
- Don't use the add-on for spam or unsolicited messages
- Keep the add-on updated to latest version

### 2. Reliability

- Monitor the `/health` endpoint
- Set up automations to alert on disconnections
- Keep backups of your configuration
- Test thoroughly before production use

### 3. Security

- Use strong passwords for Home Assistant
- Limit access to the add-on API
- Don't expose the add-on port externally
- Regularly update the add-on

## Rollback Instructions

If you need to rollback to v1.5.0:

1. Go to **Supervisor** → **Add-on Store** → **Whatsapp**
2. Click on the three dots menu
3. Select **Reinstall**
4. Choose version **1.5.0**
5. Re-authenticate with QR code

**Note:** You will lose any messages sent/received during v2.0.0 usage.

## Support

If you encounter issues:

1. Check the [CHANGELOG.md](CHANGELOG.md) for known issues
2. Review the add-on logs for error messages
3. Search existing GitHub issues
4. Create a new issue with:
   - Add-on version
   - Home Assistant version
   - Error logs
   - Steps to reproduce

## Additional Resources

- [Baileys Documentation](https://whiskey.so/)
- [Home Assistant Add-ons](https://www.home-assistant.io/addons/)
- [GitHub Repository](https://github.com/giuseppecastaldo/ha-addons)

---

**Last Updated:** December 31, 2025
**Version:** 2.0.0
