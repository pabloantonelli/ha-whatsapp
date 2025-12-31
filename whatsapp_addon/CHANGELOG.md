## 2.0.8

**Bug Fix Release**

- 🐛 **Fixed script crash** - Removed problematic ip addr show command
- ✅ **Script completes** - Add-on now starts successfully
- 🔍 **Using IP 172.30.33.7** - Confirmed working IP address

This fixes the script crash that prevented the add-on from starting in v2.0.7.

## 2.0.7

**Diagnostic Release**

- 🔍 **Using bashio::addon.ip_address** - Get add-on's actual IP address
- 📝 **Extensive logging** - Added detailed logs for debugging
- 🐛 **Network diagnostics** - Shows IP, hostname, network interfaces
- ✅ **Verification** - Checks custom component before and after installation

This version adds extensive logging to diagnose the connection issue. Logs will show:
- Add-on IP address
- Network configuration
- Custom component HOST value before and after update
- Installed component verification

## 2.0.6

**Critical Fix Release**

- 🐛 **Fixed DNS hostname** - Using `whatsapp-addon` (with hyphen) instead of `whatsapp_addon`
- 🔧 **Valid DNS name** - Underscores are not valid in DNS hostnames, must use hyphens
- 📚 **Based on HA docs** - Following Home Assistant's internal network naming convention

This fixes the error: `Failed to resolve 'whatsapp_addon'`

According to Home Assistant documentation, add-on slugs with underscores must be converted to hyphens for valid DNS hostnames.

## 2.0.5

**Bug Fix Release**

- 🐛 **Fixed bashio command** - Using hardcoded slug instead of bashio::addon.slug
- 🔧 **Hardcoded whatsapp_addon** - Direct value from config.yaml
- ✅ **Should work now** - No more command not found errors

This fixes the error: `bashio::addon.slug: command not found`

## 2.0.4

**Bug Fix Release**

- 🐛 **Fixed hostname using add-on slug** - Using bashio::addon.slug instead of $HOSTNAME
- 🔧 **Improved reliability** - Add-on slug is consistent across installations
- 📝 **Better logging** - Shows configured slug for debugging

This should finally fix the hostname resolution issue by using the add-on slug (whatsapp_addon) instead of the container hostname.

## 2.0.3

**Bug Fix Release**

- 🐛 **Fixed custom component hostname** - Restored {{HOSTNAME}} placeholder
- 📝 **Improved logging** - Added hostname logging in run.sh
- 🔧 **Fixed connection issue** - Custom component can now connect to add-on

This fixes the error: `Failed to resolve '0a91b8e8-whatsapp-addon'`

## 2.0.2

**Bug Fix Release**

- 🐛 **Fixed EventEmitter import** - Changed to default import for CommonJS compatibility
- 🔧 **Fixed ESM/CommonJS interop** - eventemitter2 is a CommonJS module

This fixes the error: `SyntaxError: Named export 'EventEmitter' not found`

## 2.0.1

**Bug Fix Release**

- 🐛 **Fixed Docker build** - Added custom_component to Dockerfile
- 🐛 **Fixed run.sh paths** - Corrected paths for custom component installation
- 🐛 **Fixed .dockerignore** - Removed exclusion of custom_component folder
- 📝 **Improved logging** - Added better startup messages

This fixes the issue where the add-on would fail to start with "No such file or directory" error.

## 2.0.0

**BREAKING CHANGES - Major Update to Baileys 7.0.0-rc.9**

- 🚀 **Updated to Baileys 7.0.0-rc.9** - Latest WhatsApp Web API with improved stability
- 📦 **Migrated to ESM (ES Modules)** - Modern JavaScript module system
- 🔐 **LID Support** - Full support for Linked Device Identifiers
- 🤝 **Meta Coexistence** - Compatible with Meta Business API
- ⚡ **Performance Improvements** - 80% bundle size reduction, faster message processing
- 🛡️ **Enhanced Security** - Removed automatic ACKs to reduce ban risk
- 🔧 **Better Error Handling** - Improved error messages and async/await throughout
- 📊 **Health Check Endpoint** - New `/health` endpoint for monitoring
- 🐛 **Bug Fixes** - Multiple stability and reliability improvements
- 📝 **Updated Dependencies** - All dependencies updated to latest versions

**Migration Notes:**
- This version requires re-authentication (scan QR code again)
- Session data from previous versions is not compatible
- All API endpoints remain the same for backward compatibility

## 1.5.0

- Updated whatsapp library
- Updated docker base image

## 1.4.1

- Bug QR-Code fixed

## 1.4.0

- Updated whatsapp library
- Changed session saving method
- Special functions such as sending buttons, sending lists, etc., are no longer available.

## 1.3.5

- Revert [(Pull request)](https://github.com/giuseppecastaldo/ha-addons/pull/33)

## 1.3.4

- Bug fixed [(Pull request)](https://github.com/giuseppecastaldo/ha-addons/pull/33)
- Bug fixed [(Pull request)](https://github.com/giuseppecastaldo/ha-addons/pull/55)

## 1.3.3

- Added donation button.

## 1.3.2

- Bug fixed.

## 1.3.0

- Bug fixed.

## 1.2.4

- Bug fixed.
- Added patch for receive button on iOS (Attention! iOS receive buttons only if app is open (it seems to be a iOS app bug))

## 1.2.2

- Added the ability to always be online or offline. This could lead to not receiving notifications on other devices. (**Restard required**)
- Bug fixed.

## 1.2.1

- Fixed bug that did not allow the reception of push notifications on other devices.
- Added event presence update.
- Added two more services like subscribe presence and send presence update.

## 1.2.0

- **Changed radically command and events. Please refer to doc and developer tools for change your automations.**
- **Performance boost! (Required re-authentication)**
- Bug fixed on send location.
- Bug fixed on send mulitple buttons.

## 1.1.2

- Bug fixed.
- Performance improvements.

## 1.1.1

- Migration from Home Assistant base image to Debian image

## 1.1.0

- Added the ability to manage multiple whatsapp sessions (re-authentication required)
- Buttons bug fixed (better visibility on android devices)
- Message options bug fixed
- Bug fixed.

**NOTE:** If you have problems with the custom components being updated, please follow this steps:

- Remove Whatsapp configuration in _configuration.yaml_
- Restart Home Assistant
- Add Whatsapp configuration in _configuration.yaml_
- Restart Home Assistant

## 1.0.2

- Addedd message revoke event.
- Added buttons message type (view documentation) (may not work properly on some devices)
- Added set status service (for sets the current user's status message)
- Bug fixed.

## 1.0.1

- Initial release
