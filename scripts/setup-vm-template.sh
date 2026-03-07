#!/bin/bash
# Cloud Computer — Ubuntu Desktop VM Template Setup
# Run as root inside Proxmox Ubuntu 22.04 VM, then convert to template
# Creates the base image with all pre-installed apps

set -e

echo "=== Cloud Computer VM Template Setup ==="

# 1. System update
echo "[1/12] Updating system..."
apt update && apt upgrade -y

# 2. Install XFCE desktop environment
echo "[2/12] Installing XFCE desktop..."
apt install -y xfce4 xfce4-goodies xfce4-terminal dbus-x11

# 3. Install xrdp (Remote Desktop Protocol server)
echo "[3/12] Installing xrdp..."
apt install -y xrdp
systemctl enable xrdp
echo xfce4-session > /home/cloudcomputer/.xsession 2>/dev/null || true
adduser xrdp ssl-cert

# 4. Install x11vnc (VNC server bridged by websockify)
echo "[4/12] Installing x11vnc..."
apt install -y x11vnc
mkdir -p /home/cloudcomputer/.vnc
x11vnc -storepasswd changeme /home/cloudcomputer/.vnc/passwd
chown -R cloudcomputer:cloudcomputer /home/cloudcomputer/.vnc

# 5. Install websockify + noVNC web files
echo "[5/12] Installing websockify + noVNC..."
apt install -y websockify novnc python3

# 6. Create default user account
echo "[6/12] Creating default user..."
useradd -m -s /bin/bash cloudcomputer 2>/dev/null || true
echo 'cloudcomputer:changeme' | chpasswd    # overwritten on provisioning
usermod -aG sudo cloudcomputer

# 7. Install Google Chrome
echo "[7/12] Installing Google Chrome..."
wget -q -O /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
apt install -y /tmp/chrome.deb
rm /tmp/chrome.deb

# 8. Install Firefox
echo "[8/12] Installing Firefox..."
apt install -y firefox

# 9. Install Telegram Desktop
echo "[9/12] Installing Telegram Desktop..."
apt install -y telegram-desktop || {
  snap install telegram-desktop 2>/dev/null || {
    wget -q -O /tmp/telegram.tar.xz https://telegram.org/dl/desktop/linux
    tar xf /tmp/telegram.tar.xz -C /opt/
    ln -sf /opt/Telegram/Telegram /usr/local/bin/telegram-desktop
    rm /tmp/telegram.tar.xz
  }
}

# 10. Install Cursor IDE
echo "[10/12] Installing Cursor IDE..."
wget -q -O /tmp/cursor.appimage https://downloader.cursor.sh/linux/appImage/x64
chmod +x /tmp/cursor.appimage
mv /tmp/cursor.appimage /opt/cursor.appimage
cat > /usr/share/applications/cursor.desktop << 'DESKTOP'
[Desktop Entry]
Name=Cursor
Exec=/opt/cursor.appimage --no-sandbox
Icon=text-editor
Type=Application
Categories=Development;IDE;
DESKTOP
ln -sf /opt/cursor.appimage /usr/local/bin/cursor

# 11. Install Claude Code CLI
echo "[11/12] Installing Claude Code CLI..."
# Install Node.js 20 LTS first
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g @anthropic-ai/claude-code

# 12. Install OpenClaw
echo "[12/12] Installing OpenClaw..."
npm install -g openclaw 2>/dev/null || {
  echo "OpenClaw not found on npm, will install from source if available"
  # Placeholder — install from GitHub or other source when available
}

# Configure DNS and networking (CRITICAL for internet access)
echo "Configuring DNS and networking..."

# Disable systemd-resolved stub listener (causes DNS resolution failures in cloned VMs)
mkdir -p /etc/systemd/resolved.conf.d
cat > /etc/systemd/resolved.conf.d/dns.conf << 'DNSCONF'
[Resolve]
DNS=1.1.1.1 8.8.8.8 1.0.0.1 8.8.4.4
FallbackDNS=9.9.9.9
DNSStubListener=no
DNSCONF

# Ensure resolv.conf points to systemd-resolved output (not the stub)
ln -sf /run/systemd/resolve/resolv.conf /etc/resolv.conf

# Create a netplan config that ensures DHCP + DNS on the default interface
cat > /etc/netplan/99-cloudcomputer.yaml << 'NETPLAN'
network:
  version: 2
  ethernets:
    ens18:
      dhcp4: true
      nameservers:
        addresses: [1.1.1.1, 8.8.8.8, 1.0.0.1, 8.8.4.4]
      dhcp4-overrides:
        use-dns: true
    eth0:
      dhcp4: true
      nameservers:
        addresses: [1.1.1.1, 8.8.8.8, 1.0.0.1, 8.8.4.4]
      dhcp4-overrides:
        use-dns: true
NETPLAN

# Apply netplan (ignore errors since interfaces may not exist yet in template)
netplan apply 2>/dev/null || true

# Create a boot-time DNS fix script that runs on every startup
cat > /usr/local/bin/fix-dns.sh << 'FIXDNS'
#!/bin/bash
# Ensure DNS resolution works on every boot
# This is a safety net for cloned VMs where DNS can break

# Wait for network
sleep 5

# Check if DNS works
if ! host google.com > /dev/null 2>&1; then
  echo "DNS not working, applying fix..."

  # Direct resolv.conf fallback
  cat > /etc/resolv.conf << 'EOF'
nameserver 1.1.1.1
nameserver 8.8.8.8
nameserver 1.0.0.1
nameserver 8.8.4.4
EOF

  # Restart systemd-resolved
  systemctl restart systemd-resolved 2>/dev/null || true

  # Re-apply netplan
  netplan apply 2>/dev/null || true

  echo "DNS fix applied"
fi
FIXDNS
chmod +x /usr/local/bin/fix-dns.sh

# Create systemd service for boot-time DNS fix
cat > /etc/systemd/system/fix-dns.service << 'UNIT'
[Unit]
Description=Fix DNS Resolution on Boot
After=network-online.target systemd-resolved.service
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/fix-dns.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
UNIT
systemctl enable fix-dns.service

# Additional dev tools
echo "Installing additional dev tools..."
apt install -y git curl wget unzip htop nano vim build-essential

# Create desktop startup script
cat > /usr/local/bin/start-cloudcomputer.sh << 'SCRIPT'
#!/bin/bash
export DISPLAY=:0
Xvfb :0 -screen 0 1280x800x24 &
sleep 2
su cloudcomputer -c 'DISPLAY=:0 startxfce4 &'
sleep 3
su cloudcomputer -c 'x11vnc -display :0 -rfbport 5900 -rfbauth /home/cloudcomputer/.vnc/passwd -forever -bg -noxdamage'
websockify --web=/usr/share/novnc 0.0.0.0:6080 localhost:5900 &
SCRIPT
chmod +x /usr/local/bin/start-cloudcomputer.sh

# Create systemd service
cat > /etc/systemd/system/cloudcomputer-desktop.service << 'UNIT'
[Unit]
Description=Cloud Computer Desktop Environment
After=network.target

[Service]
ExecStart=/usr/local/bin/start-cloudcomputer.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT
systemctl enable cloudcomputer-desktop.service

# Create desktop shortcuts for the user
mkdir -p /home/cloudcomputer/Desktop
for app in google-chrome firefox telegram-desktop cursor; do
  cp /usr/share/applications/${app}.desktop /home/cloudcomputer/Desktop/ 2>/dev/null || true
done
chmod +x /home/cloudcomputer/Desktop/*.desktop 2>/dev/null || true
chown -R cloudcomputer:cloudcomputer /home/cloudcomputer/Desktop

# Create a welcome note on desktop
cat > /home/cloudcomputer/Desktop/WELCOME.txt << 'EOF'
Welcome to Cloud Computer!

Your cloud desktop comes pre-installed with:
  - Google Chrome
  - Firefox
  - Telegram Desktop
  - Cursor IDE
  - Claude Code CLI (run: claude in terminal)
  - OpenClaw

IMPORTANT: Please change your password!
Open a terminal and run: passwd

For support visit: https://cloudcode.space
EOF
chown cloudcomputer:cloudcomputer /home/cloudcomputer/Desktop/WELCOME.txt

# Install qemu-guest-agent (REQUIRED for Proxmox exec API)
apt install -y qemu-guest-agent
systemctl enable qemu-guest-agent

# Clean up for template
apt autoremove -y && apt clean
truncate -s 0 /etc/machine-id
rm -f /var/lib/dbus/machine-id
ln -s /etc/machine-id /var/lib/dbus/machine-id

echo ""
echo "=== Template setup complete! ==="
echo "Now shut down and convert to template in Proxmox."
echo "  shutdown now"
echo ""
