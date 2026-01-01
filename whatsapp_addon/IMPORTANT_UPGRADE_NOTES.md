# ⚠️ IMPORTANT: Upgrade Instructions to v2.1.0

## Critical Step: You MUST Restart Home Assistant Core

After updating the add-on, the custom component needs to be reloaded with the new IP configuration.

### Why?

The add-on updates the custom component files with the correct internal IP address (e.g., `172.30.33.x`), but Home Assistant Core keeps the old version loaded in memory until you restart it.

### Step-by-Step Upgrade Process

1. **Update the Add-on**
   - Go to **Supervisor** → **Add-on Store**
   - Update **Whatsapp** to **v2.1.0** (Stable Release)
   - Click **Start**

2. **Verify Add-on Logs**
   - Check that logs show something like:
     ```
     [INFO] Updated HOST line: HOST = 'http://172.30.33.7:3000'
     [INFO] ✅ Variable HOST updated correctly with IP 172.30.33.7
     ```

3. **⚠️ RESTART HOME ASSISTANT CORE** (CRITICAL!)
   - Go to **Settings** → **System** → **Restart**
   - Click **Restart Home Assistant**
   - Wait for Home Assistant to come back online

4. **Test the Integration**
   - Try sending a message using `whatsapp.send_message` service
   - Both text and image messages are supported!

### Verification

After restarting Home Assistant, if you check the file `/config/custom_components/whatsapp/whatsapp.py`, it should contain the direct IP address of the add-on:

```python
HOST = 'http://172.30.33.7:3000'  # Example IP
```

**TL;DR: Update add-on → Restart Home Assistant Core → Enjoy!** 🚀
