# Terminus SSH Setup Guide

**Connect to your production server from your phone/tablet!**

**Server:** seacalendar-prod (5.78.132.232)
**User:** deploy

---

## 🔑 Option 1: Generate New Key in Terminus (Recommended)

### Step 1: Generate SSH Key in Terminus

1. Open **Terminus** app
2. Tap the **hamburger menu** (≡) in top-left
3. Go to **Keychain** or **Keys**
4. Tap **+ (Plus)** to create new key
5. Choose **Generate New Key**
6. Settings:
   - **Name:** `seacalendar-prod`
   - **Type:** `ED25519` (recommended) or `RSA 4096`
   - **Passphrase:** (optional but recommended)
7. Tap **Generate**

### Step 2: Copy Public Key from Terminus

1. In Terminus **Keychain**
2. Find your new key `seacalendar-prod`
3. Tap it to open details
4. Tap **Public Key** to copy it
5. The public key is now in your clipboard

### Step 3: Add Public Key to Server

**Option A: Via existing SSH connection**

If you can currently SSH to the server from another device:

```bash
# SSH from your computer
ssh deploy@5.78.132.232

# Edit authorized_keys
nano ~/.ssh/authorized_keys

# Paste the public key from Terminus (add on new line)
# Save: Ctrl+O, Enter, Ctrl+X

# Fix permissions (important!)
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

**Option B: Via Hetzner Web Console**

If you don't have SSH access from another device:

1. Go to Hetzner Cloud Console: https://console.hetzner.cloud/
2. Find your server: `seacalendar-prod`
3. Click **Console** button (opens web terminal)
4. Login as `deploy` user
5. Run:
```bash
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# Paste the public key from Terminus
# Save: Ctrl+O, Enter, Ctrl+X
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Step 4: Configure Host in Terminus

1. In Terminus, go to **Hosts**
2. Tap **+ (Plus)** to add new host
3. Fill in:
   - **Alias:** `seacalendar-prod`
   - **Hostname:** `5.78.132.232`
   - **Port:** `22`
   - **Username:** `deploy`
   - **Authentication:** `Public Key`
   - **Key:** Select `seacalendar-prod` (the key you generated)
   - **Passphrase:** Enter if you set one
4. Tap **Save**

### Step 5: Connect!

1. In **Hosts** list
2. Tap `seacalendar-prod`
3. Should connect! 🎉

---

## 🔑 Option 2: Use Existing SSH Key (From Computer)

If you already have SSH access from your computer and want to use that same key:

### Step 1: Get Your Private Key from Computer

```bash
# On your computer
cat ~/.ssh/id_ed25519
# OR
cat ~/.ssh/id_rsa

# Copy the entire output including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ... key content ...
# -----END OPENSSH PRIVATE KEY-----
```

### Step 2: Import Key to Terminus

1. Open **Terminus**
2. Go to **Keychain**
3. Tap **+ (Plus)**
4. Choose **Import Existing Key**
5. **Method:** `Paste Key Content`
6. Paste your private key
7. **Name:** `my-computer-key`
8. Enter passphrase if your key has one
9. Tap **Import**

### Step 3: Configure Host (Same as Above)

Follow **Step 4** from Option 1

---

## 🔧 Troubleshooting

### "Permission denied (publickey)"

**Check key is in authorized_keys:**
```bash
# On server
cat ~/.ssh/authorized_keys
# Should see your public key
```

**Check permissions:**
```bash
# On server
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
ls -la ~/.ssh
# Should show:
# drwx------ (700) for .ssh directory
# -rw------- (600) for authorized_keys file
```

**Verify key format:**
- Public key should start with: `ssh-ed25519` or `ssh-rsa`
- Should be all one line (no line breaks)
- Should end with comment (optional)

### "Connection refused"

**Check server is reachable:**
```bash
# From another device
ping 5.78.132.232
ssh deploy@5.78.132.232
```

**Check UFW firewall allows SSH:**
```bash
# On server
sudo ufw status
# Should show: 22/tcp ALLOW
```

### "Host key verification failed"

In Terminus:
1. Go to **Hosts**
2. Edit your `seacalendar-prod` host
3. Scroll down to **Advanced**
4. Enable **Trust On First Use (TOFU)**
5. Save and reconnect

### Key not working after import

**Check key format:**
- Terminus supports: OpenSSH format (default)
- If you have PuTTY format (.ppk), convert to OpenSSH first

**Re-import cleanly:**
1. Delete key from Terminus Keychain
2. Re-import making sure entire key is copied
3. Verify passphrase if key has one

---

## 📱 Terminus Tips

### Quick Commands

**View system status:**
```bash
docker ps
systemctl status caddy
df -h
```

**View logs:**
```bash
docker compose -f docker-compose.prod.yml logs -f
journalctl -u caddy -f
```

**Deploy updates:**
```bash
cd /opt/seacalendar
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Useful Terminus Features

**Snippets:**
- Create snippets for common commands
- Tap snippet to insert
- Save frequently used commands

**Tabs:**
- Multiple tabs for different terminals
- Swipe left/right to switch

**Port Forwarding:**
- Settings → Port Forward
- Access local services remotely

**SFTP:**
- Long-press on host
- Choose "SFTP"
- Browse/upload/download files

---

## 🔐 Security Best Practices

### Key Management

**Do:**
- ✅ Use ED25519 keys (modern & secure)
- ✅ Set passphrase on private key
- ✅ Use different keys per device
- ✅ Name keys clearly

**Don't:**
- ❌ Share private keys between devices
- ❌ Email/text private keys
- ❌ Use keys without passphrase (on mobile especially)
- ❌ Leave Terminus unlocked

### Terminus Security

1. **Enable biometric lock:**
   - Settings → Security
   - Enable Face ID / Touch ID
   - Lock after: 1 minute

2. **Backup keys securely:**
   - Settings → Backup
   - Use encrypted backup
   - Store in secure location (iCloud Keychain)

3. **Review access:**
   - Keychain → Review keys
   - Delete unused keys
   - Rotate keys periodically

---

## 🎯 Quick Reference

### Connection Info

```
Host: 5.78.132.232
Port: 22
User: deploy
Auth: Public Key
```

### Add Your Public Key to Server

```bash
# On server
nano ~/.ssh/authorized_keys
# Paste public key from Terminus
# Save and set permissions:
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Test Connection

```bash
# In Terminus, after connecting:
whoami
# Should output: deploy

hostname
# Should output: seacalendar-prod

pwd
# Should output: /home/deploy
```

---

## 🔗 Alternative SSH Apps (iOS/Mobile)

If Terminus doesn't work for you:

**iOS:**
- **Blink Shell** (paid, excellent)
- **Termius** (freemium)
- **Prompt 3** (paid)
- **SSH Term Pro** (free)

**Android:**
- **JuiceSSH** (freemium)
- **Termux** (free, full terminal)
- **ConnectBot** (free, open source)

All follow similar setup process: generate/import key → add host → connect

---

## 📚 Related Documentation

- **Server Info:** `SERVER_INFO.md`
- **Deployment:** `DEPLOYMENT.md`
- **Production Setup:** `PRODUCTION_SETUP.md`

---

## ✅ Success Checklist

After setup, verify:
- [ ] SSH key generated/imported in Terminus
- [ ] Public key added to server's `~/.ssh/authorized_keys`
- [ ] Permissions correct (700 for .ssh, 600 for authorized_keys)
- [ ] Host configured in Terminus
- [ ] Can connect successfully
- [ ] Can run commands (try `docker ps`)
- [ ] Biometric lock enabled in Terminus

---

**Happy mobile server management!** 📱🚀
