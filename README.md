[![Buy Me a Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/zkfpkdwyhyq)

# Home Assistant Add-on: WhatsApp (Maintained Fork)

> **🔔 This is a maintained fork of the [original repository](https://github.com/giuseppecastaldo/ha-addons) by Giuseppe Castaldo**
>
> This fork focuses on keeping the add-on updated with the latest WhatsApp Web API (Baileys) and adding new features.

_Send WhatsApp messages from Home Assistant using the latest WhatsApp Web API_

<img src="https://github.com/giuseppecastaldo/ha-addons/blob/main/whatsapp_addon/logo.png?raw=true" width="400"/>

![Supports aarch64 Architecture][aarch64-shield]
![Supports amd64 Architecture][amd64-shield]
![Supports armhf Architecture][armhf-shield]
![Supports armv7 Architecture][armv7-shield]
![Supports i386 Architecture][i386-shield]

[aarch64-shield]: https://img.shields.io/badge/aarch64-yes-green.svg
[amd64-shield]: https://img.shields.io/badge/amd64-yes-green.svg
[armhf-shield]: https://img.shields.io/badge/armhf-yes-green.svg
[armv7-shield]: https://img.shields.io/badge/armv7-yes-green.svg
[i386-shield]: https://img.shields.io/badge/i386-yes-green.svg

## 🚀 What's New in This Fork

### Version 2.0.0 (December 31, 2025)

This fork has been updated to **Baileys 7.0.0-rc.9**, the latest WhatsApp Web API library with:

- ✅ **Enhanced Stability** - Improved connection reliability and message delivery
- ✅ **LID Support** - Full support for Linked Device Identifiers
- ✅ **Meta Coexistence** - Compatible with Meta Business API
- ✅ **Better Security** - Reduced ban risk with optimized protocol compliance
- ✅ **Performance** - 80% smaller bundle size and faster processing
- ✅ **Modern Architecture** - Migrated to ES Modules (ESM)
- ✅ **Health Check** - New monitoring endpoint

See [CHANGELOG](whatsapp_addon/CHANGELOG.md) for detailed changes.

## 📋 About This Fork

### Original Project
- **Original Author:** [Giuseppe Castaldo](https://github.com/giuseppecastaldo)
- **Original Repository:** https://github.com/giuseppecastaldo/ha-addons
- **License:** Apache License 2.0

### Fork Maintainer
- **Maintainer:** Pablo Antonelli
- **Fork Repository:** https://github.com/pabloantonelli/ha-whatsapp
- **Fork Date:** December 31, 2025

### Why This Fork?

The original repository has not been updated since version 1.5.0 (Baileys 6.7.12). This fork aims to:

1. **Keep Updated** - Maintain compatibility with latest WhatsApp Web API
2. **Add Features** - Implement new capabilities as they become available
3. **Fix Issues** - Address bugs and improve stability
4. **Improve Documentation** - Better guides and troubleshooting

**Note:** This fork maintains full compatibility with the original add-on's API and configuration.

## 🔧 Installation

### Option 1: Add This Repository to Home Assistant

1. Go to **Supervisor** → **Add-on Store** → **⋮** (three dots) → **Repositories**
2. Add this repository URL:
   ```
   https://github.com/pabloantonelli/ha-whatsapp
   ```
3. Find **Whatsapp** in the add-on store
4. Click **Install**

### Option 2: One-Click Installation

[![Open your Home Assistant instance and show the add add-on repository dialog with a specific repository URL pre-filled.](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fpabloantonelli%2Fha-whatsapp)

## 📖 Usage

### 1. Start the Add-on

After installation:
1. Go to the **Whatsapp** add-on page
2. Click **Start**
3. Wait for a notification with a QR code

### 2. Scan QR Code

1. Open WhatsApp on your phone
2. Go to **Settings** → **Linked Devices**
3. Tap **Link a Device**
4. Scan the QR code from the Home Assistant notification

### 3. Configure Home Assistant

Add to your `configuration.yaml`:

```yaml
whatsapp:
```

Then restart Home Assistant.

### 4. Send Messages

Use the `whatsapp.send_message` service:

```yaml
service: whatsapp.send_message
data:
  clientId: default
  to: "+1234567890"
  body:
    text: "Hello from Home Assistant!"
```

## 📚 Documentation

- **[Migration Guide](whatsapp_addon/MIGRATION.md)** - Upgrading from v1.5.0 to v2.0.0
- **[Technical Notes](whatsapp_addon/TECHNICAL_NOTES.md)** - Developer documentation
- **[Changelog](whatsapp_addon/CHANGELOG.md)** - Version history
- **[README (Español)](whatsapp_addon/README_ES.md)** - Spanish documentation

## ⚠️ Important Notes

### Compatibility

- ✅ **API Compatible** - All services work the same as the original
- ✅ **Configuration Compatible** - No changes needed in `configuration.yaml`
- ⚠️ **Re-authentication Required** - v2.0.0 requires scanning QR code again

### WhatsApp Policy

**IMPORTANT:** WhatsApp does not officially support bots or unofficial clients. While this add-on works, there is always a risk of being blocked. Use at your own risk.

**Best Practices:**
- Don't send spam or unsolicited messages
- Avoid sending too many messages in a short time
- Don't use for commercial purposes without proper authorization
- Keep the add-on updated

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork this repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Please ensure your contributions comply with the Apache License 2.0.

## 🐛 Issues & Support

### For This Fork (v2.0.0+)
- Open an issue in this repository
- Include add-on version, Home Assistant version, and logs

### For Original Functionality
- Check the [original repository](https://github.com/giuseppecastaldo/ha-addons)

## 📜 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

### Credits

**Original Work:**
- Copyright © Giuseppe Castaldo
- Licensed under Apache License 2.0

**Fork Modifications (v2.0.0+):**
- Copyright © 2025 Pablo Antonelli
- Licensed under Apache License 2.0

See [NOTICE](NOTICE) file for detailed attribution.

## 🙏 Acknowledgments

- **Giuseppe Castaldo** - For creating the original WhatsApp Home Assistant Add-on
- **WhiskeySockets/Baileys** - For the WhatsApp Web API library
- **Home Assistant Community** - For continuous support

## ☕ Support

If you find this fork useful, consider:

- ⭐ Starring this repository
- 🐛 Reporting issues
- 🔧 Contributing improvements
- ☕ [Buying the original author a coffee](https://www.buymeacoffee.com/zkfpkdwyhyq)

---

**Maintained by:** Pablo Antonelli  
**Based on:** [giuseppe castaldo/ha-addons](https://github.com/giuseppecastaldo/ha-addons)  
**License:** Apache License 2.0
