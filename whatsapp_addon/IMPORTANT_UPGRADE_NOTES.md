# ⚠️ IMPORTANT: Upgrade Instructions for v2.0.5

## Critical Step: You MUST Restart Home Assistant Core

After updating to v2.0.5, the custom component needs to be reloaded with the new hostname configuration.

### Why?

The add-on updates the custom component file with the correct hostname (`whatsapp_addon`), but Home Assistant Core has already loaded the old version with the wrong hostname (`0a91b8e8-whatsapp-addon`).

### Step-by-Step Upgrade Process

1. **Update the Add-on**
   - Go to **Supervisor** → **Add-on Store**
   - Find **Whatsapp** add-on
   - Click **Update** to v2.0.5
   - Click **Start**

2. **Verify Add-on Logs**
   - Check that logs show:
     ```
     [INFO] Updated custom component hostname to: whatsapp_addon
     ```
   - NOT: `d1c03fd7-whatsapp-addon` or similar

3. **⚠️ RESTART HOME ASSISTANT CORE** (CRITICAL!)
   - Go to **Settings** → **System** → **Restart**
   - Click **Restart Home Assistant**
   - Wait for Home Assistant to come back online

4. **Test the Integration**
   - Try sending a message using `whatsapp.send_message` service
   - Should work now!

### Why Restart is Needed?

- The add-on copies the custom component to `/config/custom_components/whatsapp/`
- Home Assistant loads custom components at startup
- Changes to custom components require a Home Assistant restart
- Just restarting the add-on is NOT enough

### Alternative: Delete and Reinstall Custom Component

If restart doesn't work:

1. Stop the Whatsapp add-on
2. Delete `/config/custom_components/whatsapp/` folder
3. Start the Whatsapp add-on (it will recreate the folder)
4. Restart Home Assistant Core

### Verification

After restarting Home Assistant, check the custom component file:

```bash
cat /config/custom_components/whatsapp/whatsapp.py | grep HOST
```

Should show:
```python
HOST = 'http://whatsapp_addon:3000'
```

NOT:
```python
HOST = 'http://0a91b8e8-whatsapp-addon:3000'
```

---

## Troubleshooting

### Still getting "Failed to resolve" error?

1. **Check add-on logs** - Verify hostname is `whatsapp_addon`
2. **Check custom component** - Verify the file has the correct hostname
3. **Restart HA again** - Sometimes it takes two restarts
4. **Check network mode** - Add-on should be in `host` network mode

### Error persists after restart?

The issue might be with Home Assistant's internal DNS or network configuration. Try:

1. Restart the entire Home Assistant OS (not just Core)
2. Check if other add-ons can communicate with each other
3. Report the issue with full logs

---

**TL;DR: Update add-on → Restart Home Assistant Core → Test**
