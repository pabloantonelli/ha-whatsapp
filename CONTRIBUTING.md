# Contributing to WhatsApp Home Assistant Add-on (Fork)

Thank you for your interest in contributing to this project! This is a maintained fork of the [original repository](https://github.com/giuseppecastaldo/ha-addons) by Giuseppe Castaldo.

## 📋 About This Fork

This fork was created to:
- Keep the add-on updated with the latest WhatsApp Web API (Baileys)
- Add new features and improvements
- Fix bugs and improve stability
- Maintain compatibility with the original add-on

## 🤝 How to Contribute

### Reporting Issues

1. **Check existing issues** first to avoid duplicates
2. **Use the issue template** if available
3. **Include relevant information:**
   - Add-on version
   - Home Assistant version
   - Error logs (if applicable)
   - Steps to reproduce
   - Expected vs actual behavior

### Submitting Pull Requests

1. **Fork this repository** (not the original)
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes:**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed
4. **Test your changes:**
   - Test on a local Home Assistant instance
   - Verify all existing functionality still works
5. **Commit your changes:**
   ```bash
   git commit -m "feat: add your feature description"
   ```
   Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
6. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request** with a clear description

## 📝 Code Guidelines

### JavaScript/Node.js

- Use **ES Modules (ESM)** syntax (`import`/`export`)
- Use **async/await** instead of callbacks
- Use **const** by default, **let** when needed, avoid **var**
- Add **JSDoc comments** for functions
- Handle errors properly with try/catch
- Use **meaningful variable names**

### Example:

```javascript
/**
 * Send a WhatsApp message
 * @param {string} phone - Phone number with country code
 * @param {Object} message - Message object
 * @returns {Promise<Object>} - Message result
 */
async function sendMessage(phone, message) {
  try {
    const result = await client.sendMessage(phone, message);
    return result;
  } catch (error) {
    logger.error('Failed to send message:', error);
    throw error;
  }
}
```

### Documentation

- Update **README.md** for user-facing changes
- Update **CHANGELOG.md** for all changes
- Update **TECHNICAL_NOTES.md** for technical changes
- Add migration notes if breaking changes

## 🔍 Testing

Before submitting a PR, please test:

1. **Installation** - Fresh install works
2. **Authentication** - QR code scanning works
3. **Message Sending** - Messages are delivered
4. **Message Receiving** - Messages are received
5. **Reconnection** - Handles disconnections gracefully
6. **Error Handling** - Errors are logged properly

## 📜 License Compliance

This project is licensed under **Apache License 2.0**, same as the original.

### Requirements:

1. **Maintain License** - Keep the Apache License 2.0
2. **Credit Original Author** - Giuseppe Castaldo must be credited
3. **Document Changes** - Clearly state what you changed
4. **Include NOTICE** - Keep the NOTICE file updated

### When Contributing:

By submitting a contribution, you agree that:
- Your contribution is your original work
- You have the right to submit it
- Your contribution will be licensed under Apache License 2.0
- You give credit to the original author

## 🎯 Priority Areas

We especially welcome contributions in these areas:

### High Priority
- 🐛 **Bug fixes** - Stability improvements
- 📚 **Documentation** - Better guides and examples
- 🔒 **Security** - Reduce ban risk
- ⚡ **Performance** - Speed and efficiency

### Medium Priority
- ✨ **Features** - New WhatsApp capabilities
- 🧪 **Testing** - Automated tests
- 🌍 **Translations** - Multi-language support
- 🎨 **UI/UX** - Better user experience

### Low Priority
- 🔧 **Refactoring** - Code cleanup
- 📊 **Monitoring** - Better logging and metrics

## 🚫 What We Don't Accept

- Changes that break compatibility with original add-on API
- Features that violate WhatsApp Terms of Service
- Code without proper error handling
- Undocumented breaking changes
- Contributions without proper licensing

## 🔄 Relationship with Original Repository

### This Fork vs Original

- **This fork** focuses on updates and new features
- **Original repository** is the source of truth for v1.5.0 and earlier
- We maintain **API compatibility** with the original

### Syncing with Original

If the original repository gets updated:
1. We will review the changes
2. Merge relevant updates
3. Maintain our improvements
4. Credit the original author

## 📞 Communication

### Questions?
- Open a **Discussion** for general questions
- Open an **Issue** for bugs or feature requests
- Check **existing documentation** first

### Need Help?
- Review the [MIGRATION.md](whatsapp_addon/MIGRATION.md) guide
- Check [TECHNICAL_NOTES.md](whatsapp_addon/TECHNICAL_NOTES.md) for details
- Look at existing code for examples

## 🙏 Recognition

Contributors will be:
- Listed in release notes
- Credited in CHANGELOG.md
- Mentioned in relevant documentation

## 📅 Review Process

1. **Initial Review** - Within 7 days
2. **Feedback** - We'll provide constructive feedback
3. **Revisions** - You make requested changes
4. **Approval** - Maintainer approves
5. **Merge** - Changes are merged
6. **Release** - Included in next version

## ✅ Checklist Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated
- [ ] Commit messages are clear
- [ ] No merge conflicts
- [ ] License compliance is maintained
- [ ] Original author is credited

## 🎉 Thank You!

Every contribution, no matter how small, helps make this project better. Thank you for taking the time to contribute!

---

**Maintainer:** Pablo Antonelli  
**Original Author:** Giuseppe Castaldo  
**License:** Apache License 2.0
