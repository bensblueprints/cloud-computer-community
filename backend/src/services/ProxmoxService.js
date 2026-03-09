/**
 * ============================================================
 * 🔒 FREEZE IT - DO NOT MODIFY THIS FILE 🔒
 * ============================================================
 * This file handles all Proxmox API calls for VM operations.
 * Changes here will break VM creation, start, stop, and VNC.
 *
 * Last verified working: 2026-03-07
 * ============================================================
 */

const axios = require("axios");

class ProxmoxService {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.PROXMOX_HOST,
      headers: {
        Authorization: `PVEAPIToken=${process.env.PROXMOX_USER}!${process.env.PROXMOX_TOKEN_ID}=${process.env.PROXMOX_TOKEN_SECRET}`
      },
      httpsAgent: new (require("https").Agent)({ rejectUnauthorized: false })
    });
    this.node = process.env.PROXMOX_NODE || "pve";
  }

  async cloneTemplate(templateVmid, newVmid, name) {
    const res = await this.client.post(
      `/api2/json/nodes/${this.node}/qemu/${templateVmid}/clone`,
      { newid: newVmid, name, full: 1 }
    );
    // Wait for clone task to complete
    const upid = res.data.data;
    if (upid) {
      await this.waitForTask(upid);
    }
    return res.data;
  }

  async waitForTask(upid, timeout = 300000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const res = await this.client.get(
          `/api2/json/nodes/${this.node}/tasks/${encodeURIComponent(upid)}/status`
        );
        const task = res.data.data;
        if (task.status === "stopped") {
          if (task.exitstatus === "OK") {
            return task;
          } else {
            throw new Error(`Task failed: ${task.exitstatus}`);
          }
        }
      } catch (e) {
        if (!e.message.includes("Task failed")) {
          // Task status check error, continue polling
        } else {
          throw e;
        }
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error(`Task ${upid} did not complete within ${timeout}ms`);
  }

  async startVM(vmid) {
    const res = await this.client.post(
      `/api2/json/nodes/${this.node}/qemu/${vmid}/status/start`
    );
    return res.data;
  }

  async stopVM(vmid) {
    const res = await this.client.post(
      `/api2/json/nodes/${this.node}/qemu/${vmid}/status/stop`
    );
    return res.data;
  }

  async restartVM(vmid) {
    const res = await this.client.post(
      `/api2/json/nodes/${this.node}/qemu/${vmid}/status/reboot`
    );
    return res.data;
  }

  async deleteVM(vmid) {
    const res = await this.client.delete(
      `/api2/json/nodes/${this.node}/qemu/${vmid}`
    );
    return res.data;
  }

  async getVMStatus(vmid) {
    const res = await this.client.get(
      `/api2/json/nodes/${this.node}/qemu/${vmid}/status/current`
    );
    return res.data.data;
  }

  async getNodeStats() {
    const res = await this.client.get(`/api2/json/nodes/${this.node}/status`);
    return res.data.data;
  }

  async listAllVMs() {
    const res = await this.client.get(`/api2/json/nodes/${this.node}/qemu`);
    return res.data.data;
  }

  async getVMNetworkInfo(vmid) {
    try {
      const res = await this.client.get(
        `/api2/json/nodes/${this.node}/qemu/${vmid}/agent/network-get-interfaces`
      );
      const interfaces = res.data.data?.result || [];
      for (const iface of interfaces) {
        if (iface.name !== "lo" && iface["ip-addresses"]) {
          for (const ip of iface["ip-addresses"]) {
            if (ip["ip-address-type"] === "ipv4" && !ip["ip-address"].startsWith("127.")) {
              return ip["ip-address"];
            }
          }
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async waitForVMReady(vmid, timeout = 300000) {
    const start = Date.now();
    console.log(`Waiting for VM ${vmid} to become ready (timeout: ${timeout}ms)`);
    
    // First, wait for VM to be in running state
    let vmRunning = false;
    while (Date.now() - start < timeout && !vmRunning) {
      try {
        const status = await this.getVMStatus(vmid);
        if (status.status === "running") {
          vmRunning = true;
          console.log(`VM ${vmid} is now running`);
        }
      } catch (e) {
        console.log(`VM ${vmid} status check error:`, e.message);
      }
      if (!vmRunning) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    if (!vmRunning) {
      throw new Error(`VM ${vmid} did not start within ${timeout}ms`);
    }

    // Now wait for guest agent to report IP (with remaining time)
    const remainingTime = timeout - (Date.now() - start);
    const ipStart = Date.now();
    
    while (Date.now() - ipStart < remainingTime) {
      try {
        const ip = await this.getVMNetworkInfo(vmid);
        if (ip) {
          console.log(`VM ${vmid} has IP: ${ip}`);
          const status = await this.getVMStatus(vmid);
          return { ...status, ip };
        }
      } catch (e) {
        // Guest agent not ready yet
      }
      await new Promise((r) => setTimeout(r, 5000));
    }

    // VM is running but no IP yet - return anyway and let provisioning continue
    console.log(`VM ${vmid} running but no IP after ${timeout}ms - continuing anyway`);
    const status = await this.getVMStatus(vmid);
    return { ...status, ip: null };
  }

  // Wait for QEMU guest agent to be fully ready (exec works, not just ping)
  // Returns true when ready, throws error on timeout
  async waitForGuestAgent(vmid, timeout = 120000) {
    const start = Date.now();
    console.log(`Waiting for guest agent on VM ${vmid} (timeout: ${timeout}ms)`);

    while (Date.now() - start < timeout) {
      try {
        // Try a real exec command (not just ping - ping succeeds before exec is ready)
        await this.client.post(
          `/api2/json/nodes/${this.node}/qemu/${vmid}/agent/exec`,
          { command: "id" }
        );
        console.log(`Guest agent fully ready on VM ${vmid}`);
        return true;
      } catch (e) {
        const status = e.response?.status;
        if (status === 596 || status === 500) {
          // Guest agent not ready yet, keep waiting
        } else {
          console.log(`Guest agent check error on VM ${vmid}:`, e.message);
        }
      }
      await new Promise((r) => setTimeout(r, 5000));
    }

    throw new Error(`Guest agent on VM ${vmid} did not become ready within ${timeout}ms`);
  }

  // Check if guest agent is ready (non-blocking)
  async isGuestAgentReady(vmid) {
    try {
      await this.client.post(
        `/api2/json/nodes/${this.node}/qemu/${vmid}/agent/ping`
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  async execInVM(vmid, command) {
    // First verify guest agent is ready
    const agentReady = await this.isGuestAgentReady(vmid);
    if (!agentReady) {
      throw new Error(`Guest agent not ready on VM ${vmid} - cannot execute command`);
    }

    const res = await this.client.post(
      `/api2/json/nodes/${this.node}/qemu/${vmid}/agent/exec`,
      { command }
    );
    return res.data;
  }

  // Write a file inside the VM using the QEMU guest agent file-write API
  // This is much more reliable than exec for writing config files
  async writeFileInVM(vmid, filePath, content) {
    const agentReady = await this.isGuestAgentReady(vmid);
    if (!agentReady) {
      throw new Error(`Guest agent not ready on VM ${vmid} - cannot write file`);
    }

    const res = await this.client.post(
      `/api2/json/nodes/${this.node}/qemu/${vmid}/agent/file-write`,
      { file: filePath, content }
    );
    return res.data;
  }

  // Disable XFCE power management and screen blanking so VMs stay awake 24/7
  async disablePowerManagement(vmid) {
    console.log(`Disabling power management on VM ${vmid}`);
    try {
      // Disable XFCE power manager settings via xfconf
      const xfconfCmds = [
        'sudo -u cloudcode DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus xfconf-query -c xfce4-power-manager -p /xfce4-power-manager/blank-on-ac -s 0',
        'sudo -u cloudcode DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus xfconf-query -c xfce4-power-manager -p /xfce4-power-manager/dpms-on-ac-off -s 0',
        'sudo -u cloudcode DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus xfconf-query -c xfce4-power-manager -p /xfce4-power-manager/dpms-on-ac-sleep -s 0',
        'sudo -u cloudcode DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus xfconf-query -c xfce4-power-manager -p /xfce4-power-manager/dpms-enabled -s false',
        'sudo -u cloudcode DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus xfconf-query -c xfce4-power-manager -p /xfce4-power-manager/inactivity-on-ac -s 0',
      ];
      for (const cmd of xfconfCmds) {
        await this.safeExecInVM(vmid, cmd);
      }

      // Create autostart entry to disable screen blanking on every boot
      await this.safeExecInVM(vmid, 'mkdir -p /home/cloudcode/.config/autostart');
      const autostartContent = '[Desktop Entry]\nType=Application\nName=Disable Screen Blanking\nExec=sh -c "sleep 5 && xset s off && xset -dpms && xset s noblank"\nHidden=false\nNoDisplay=true\nX-GNOME-Autostart-enabled=true\n';
      try {
        await this.writeFileInVM(vmid, '/home/cloudcode/.config/autostart/disable-screensaver.desktop', autostartContent);
        await this.safeExecInVM(vmid, 'chown -R 1000:1000 /home/cloudcode/.config/autostart');
      } catch (e) { /* non-critical */ }

      // Kill xscreensaver if running
      await this.safeExecInVM(vmid, 'pkill -9 xscreensaver');

      console.log(`Power management disabled on VM ${vmid}`);
      return { success: true };
    } catch (e) {
      console.error(`Failed to disable power management on VM ${vmid}:`, e.message);
      return { success: false, error: e.message };
    }
  }

  async setRDPPassword(vmid, password) {
    try {
      return await this.execInVM(vmid, `echo "cloudcomputer:${password}" | chpasswd`);
    } catch (e) {
      console.log(`Could not set RDP password for VM ${vmid}:`, e.message);
      return null;
    }
  }

  async getVNCProxy(vmid) {
    const res = await this.client.post(
      `/api2/json/nodes/${this.node}/qemu/${vmid}/vncproxy`,
      { websocket: 1 }
    );
    return res.data.data;
  }

  async setVNCPassword(vmid, password) {
    try {
      return await this.execInVM(vmid, `x11vnc -storepasswd ${password} ~/.vnc/passwd`);
    } catch (e) {
      console.log(`Could not set VNC password for VM ${vmid}:`, e.message);
      return null;
    }
  }

  // Safe exec - doesn't throw, returns success/failure
  async safeExecInVM(vmid, command) {
    try {
      await this.client.post(
        `/api2/json/nodes/${this.node}/qemu/${vmid}/agent/exec`,
        { command }
      );
      return true;
    } catch (e) {
      console.log(`[Net] exec failed (${e.response?.status || 'unknown'}): ${command}`);
      return false;
    }
  }

  // Configure DNS and networking on a freshly provisioned VM
  // Fixes: 1) Netplan MAC matching (cloned VMs get new MACs), 2) DNS resolvers, 3) Boot-time DNS fix
  async configureNetworking(vmid) {
    console.log(`Configuring networking for VM ${vmid}`);
    try {
      // Step 1: Write clean netplan config WITHOUT MAC matching (critical for cloned VMs)
      // Cloned VMs get new MAC addresses, so the template's mac-match netplan breaks networking
      const netplanConfig = "network:\n  version: 2\n  renderer: NetworkManager\n  ethernets:\n    ens18:\n      dhcp4: true\n      nameservers:\n        addresses: [1.1.1.1, 8.8.8.8, 1.0.0.1]\n";
      try {
        await this.writeFileInVM(vmid, "/etc/netplan/00-installer-config.yaml", netplanConfig);
        console.log(`[Net] netplan config written for VM ${vmid} (no MAC matching)`);
      } catch (e) {
        console.log(`[Net] Could not write netplan: ${e.message}`);
      }

      // Step 2: Write resolv.conf directly (immediate DNS fix even before netplan apply)
      const resolvConf = "nameserver 1.1.1.1\nnameserver 8.8.8.8\nnameserver 1.0.0.1\nnameserver 8.8.4.4\n";
      await this.writeFileInVM(vmid, "/etc/resolv.conf", resolvConf);
      console.log(`[Net] resolv.conf written for VM ${vmid}`);

      // Step 3: Apply netplan (exec may fail with 596 but config is written for next boot)
      await this.safeExecInVM(vmid, "netplan apply");

      // Step 4: Write systemd-resolved config
      const resolvedConf = "[Resolve]\nDNS=1.1.1.1 8.8.8.8 1.0.0.1 8.8.4.4\nFallbackDNS=9.9.9.9\nDNSStubListener=no\n";
      await this.safeExecInVM(vmid, "mkdir -p /etc/systemd/resolved.conf.d");
      try {
        await this.writeFileInVM(vmid, "/etc/systemd/resolved.conf.d/dns.conf", resolvedConf);
      } catch (e) { /* non-critical */ }
      await this.safeExecInVM(vmid, "systemctl restart systemd-resolved");

      // Step 5: Write boot-time DNS fix script (persists across reboots)
      const fixDnsScript = '#!/bin/bash\nsleep 5\nif ! host google.com > /dev/null 2>&1; then\n  echo "nameserver 1.1.1.1" > /etc/resolv.conf\n  echo "nameserver 8.8.8.8" >> /etc/resolv.conf\n  echo "nameserver 1.0.0.1" >> /etc/resolv.conf\n  systemctl restart systemd-resolved 2>/dev/null || true\nfi\n';
      try {
        await this.writeFileInVM(vmid, "/usr/local/bin/fix-dns.sh", fixDnsScript);
        await this.safeExecInVM(vmid, "chmod +x /usr/local/bin/fix-dns.sh");
      } catch (e) { /* non-critical */ }

      // Step 6: Write and enable systemd service for boot-time fix
      const fixDnsService = "[Unit]\nDescription=Fix DNS on Boot\nAfter=network-online.target\nWants=network-online.target\n\n[Service]\nType=oneshot\nExecStart=/usr/local/bin/fix-dns.sh\nRemainAfterExit=yes\n\n[Install]\nWantedBy=multi-user.target\n";
      try {
        await this.writeFileInVM(vmid, "/etc/systemd/system/fix-dns.service", fixDnsService);
        await this.safeExecInVM(vmid, "systemctl daemon-reload");
        await this.safeExecInVM(vmid, "systemctl enable fix-dns.service");
      } catch (e) { /* non-critical */ }

      console.log(`Networking configured for VM ${vmid}`);
      return { success: true };
    } catch (e) {
      console.error(`Failed to configure networking for VM ${vmid}:`, e.message);
      return { success: false, error: e.message };
    }
  }

  // Linux user management for shared VMs
  async createLinuxUser(vmid, username, password, groups = ["sudo", "rdp"]) {
    try {
      // Sanitize username - only allow alphanumeric and underscores
      const safeUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (!safeUsername || safeUsername.length < 2) {
        throw new Error("Invalid username");
      }

      // Create user with home directory
      await this.execInVM(vmid, `useradd -m -s /bin/bash ${safeUsername}`);

      // Set password
      await this.execInVM(vmid, `echo "${safeUsername}:${password}" | chpasswd`);

      // Add to groups (sudo for admin, xrdp-related groups for RDP access)
      for (const group of groups) {
        try {
          await this.execInVM(vmid, `usermod -aG ${group} ${safeUsername}`);
        } catch (e) {
          console.log(`Could not add ${safeUsername} to group ${group}:`, e.message);
        }
      }

      // Ensure xrdp directories exist for the user
      await this.execInVM(vmid, `mkdir -p /home/${safeUsername}/.config`);
      await this.execInVM(vmid, `chown -R ${safeUsername}:${safeUsername} /home/${safeUsername}`);

      console.log(`Created Linux user ${safeUsername} on VM ${vmid}`);
      return { success: true, username: safeUsername };
    } catch (e) {
      console.error(`Failed to create Linux user on VM ${vmid}:`, e.message);
      throw e;
    }
  }

  async deleteLinuxUser(vmid, username) {
    try {
      const safeUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "");

      // Kill user processes first
      try {
        await this.execInVM(vmid, `pkill -u ${safeUsername}`);
      } catch (e) {
        // User might not have processes running
      }

      // Remove user and home directory
      await this.execInVM(vmid, `userdel -r ${safeUsername}`);

      console.log(`Deleted Linux user ${safeUsername} from VM ${vmid}`);
      return { success: true };
    } catch (e) {
      console.error(`Failed to delete Linux user on VM ${vmid}:`, e.message);
      throw e;
    }
  }

  async setLinuxUserPassword(vmid, username, password) {
    try {
      const safeUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
      await this.execInVM(vmid, `echo "${safeUsername}:${password}" | chpasswd`);
      console.log(`Reset password for ${safeUsername} on VM ${vmid}`);
      return { success: true };
    } catch (e) {
      console.error(`Failed to set password for user on VM ${vmid}:`, e.message);
      throw e;
    }
  }

  async checkLinuxUserExists(vmid, username) {
    try {
      const safeUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
      await this.execInVM(vmid, `id ${safeUsername}`);
      return true;
    } catch (e) {
      return false;
    }
  }
}

module.exports = new ProxmoxService();
