const proxmox = require('./src/services/ProxmoxService');

const vmid = parseInt(process.argv[2]) || 47866;

const netplanConfig = [
  "network:",
  "  version: 2",
  "  renderer: NetworkManager",
  "  ethernets:",
  "    ens18:",
  "      dhcp4: true",
  "      nameservers:",
  "        addresses: [1.1.1.1, 8.8.8.8, 1.0.0.1]",
  ""
].join("\n");

(async () => {
  console.log("Fixing networking for VM", vmid);

  // Write clean netplan config (no MAC matching)
  console.log("Writing netplan config...");
  await proxmox.writeFileInVM(vmid, "/etc/netplan/00-installer-config.yaml", netplanConfig);
  console.log("Netplan written!");

  // Write resolv.conf as immediate DNS fix
  const resolvConf = "nameserver 1.1.1.1\nnameserver 8.8.8.8\nnameserver 1.0.0.1\nnameserver 8.8.4.4\n";
  await proxmox.writeFileInVM(vmid, "/etc/resolv.conf", resolvConf);
  console.log("resolv.conf written!");

  // Try to apply netplan (exec may fail with 596 but the config is written)
  console.log("Applying netplan...");
  const applied = await proxmox.safeExecInVM(vmid, "netplan apply");
  console.log("Netplan apply:", applied ? "executed" : "exec failed (config still written, will apply on reboot)");

  // Wait and check for IP
  console.log("Waiting 10s for DHCP...");
  await new Promise(r => setTimeout(r, 10000));
  const ip = await proxmox.getVMNetworkInfo(vmid);
  console.log("VM", vmid, "IP:", ip || "still no IP - may need reboot");

  if (!ip) {
    console.log("Rebooting VM to apply netplan...");
    try {
      await proxmox.restartVM(vmid);
      console.log("Reboot initiated. IP should be available in ~60s");
    } catch (e) {
      console.log("Reboot failed:", e.message);
    }
  }

  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
