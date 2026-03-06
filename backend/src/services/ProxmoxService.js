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
    return res.data;
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
    while (Date.now() - start < timeout) {
      try {
        const status = await this.getVMStatus(vmid);
        if (status.status === "running" && status.agent === 1) {
          const ip = await this.getVMNetworkInfo(vmid);
          if (ip) {
            return { ...status, ip };
          }
        }
      } catch (e) {
        // VM not ready yet
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
    throw new Error(`VM ${vmid} did not become ready within ${timeout}ms`);
  }

  async execInVM(vmid, command) {
    const res = await this.client.post(
      `/api2/json/nodes/${this.node}/qemu/${vmid}/agent/exec`,
      { command }
    );
    return res.data;
  }

  async setRDPPassword(vmid, password) {
    return this.execInVM(vmid, `echo "cloudcomputer:${password}" | chpasswd`);
  }

  async getVNCProxy(vmid) {
    const res = await this.client.post(
      `/api2/json/nodes/${this.node}/qemu/${vmid}/vncproxy`,
      { websocket: 1 }
    );
    return res.data.data;
  }

  async setVNCPassword(vmid, password) {
    return this.execInVM(vmid, `x11vnc -storepasswd ${password} ~/.vnc/passwd`);
  }
}

module.exports = new ProxmoxService();
