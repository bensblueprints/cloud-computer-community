const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const proxmoxService = require("./ProxmoxService");

const prisma = new PrismaClient();

// Simple encryption for RDP passwords (use proper secrets management in production)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-32-char-encryption-key!!";
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text) {
  const parts = text.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = Buffer.from(parts[1], "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function generatePassword(length = 16) {
  return crypto.randomBytes(length).toString("base64").slice(0, length).replace(/[+/=]/g, "x");
}

function generateUsername(name, userId) {
  // Create a unique Linux username from user's name
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
  const suffix = userId.slice(-4).toLowerCase();
  return `${base || "user"}${suffix}`;
}

class VMUserService {
  /**
   * Create a VMUser record and provision Linux user on the VM
   * @param {string} vmId - Database VM ID
   * @param {string} userId - User ID to add
   * @param {string} userName - User's display name (for generating username)
   * @returns {Object} Created VMUser
   */
  async createVMUser(vmId, userId, userName) {
    // Get VM details
    const vm = await prisma.vM.findUnique({ where: { id: vmId } });
    if (!vm) {
      throw new Error("VM not found");
    }

    if (!vm.isShared) {
      throw new Error("Cannot add users to non-shared VMs");
    }

    // Check if user already has access
    const existing = await prisma.vMUser.findUnique({
      where: { vmId_userId: { vmId, userId } }
    });

    if (existing) {
      throw new Error("User already has access to this VM");
    }

    // Generate credentials
    const linuxUsername = generateUsername(userName, userId);
    const rdpPassword = generatePassword();

    // Create VMUser record with PROVISIONING status
    const vmUser = await prisma.vMUser.create({
      data: {
        vmId,
        userId,
        linuxUsername,
        rdpPasswordEnc: encrypt(rdpPassword),
        status: "PROVISIONING"
      }
    });

    return { vmUser, linuxUsername, rdpPassword, vmid: vm.vmid };
  }

  /**
   * Provision the Linux user on the VM (call this after creating record)
   * @param {string} vmUserId - VMUser ID
   */
  async provisionVMUser(vmUserId) {
    const vmUser = await prisma.vMUser.findUnique({
      where: { id: vmUserId },
      include: { vm: true }
    });

    if (!vmUser) {
      throw new Error("VMUser not found");
    }

    if (vmUser.vm.status !== "RUNNING") {
      throw new Error("VM must be running to add users");
    }

    try {
      const password = decrypt(vmUser.rdpPasswordEnc);

      // Create Linux user on VM
      await proxmoxService.createLinuxUser(
        vmUser.vm.vmid,
        vmUser.linuxUsername,
        password,
        ["sudo", "users"]  // Groups for RDP access
      );

      // Update status to ACTIVE
      await prisma.vMUser.update({
        where: { id: vmUserId },
        data: { status: "ACTIVE" }
      });

      return { success: true };
    } catch (e) {
      // Mark as failed but don't delete - allow retry
      console.error(`Failed to provision VMUser ${vmUserId}:`, e.message);
      throw e;
    }
  }

  /**
   * Get credentials for a VMUser
   * @param {string} vmUserId - VMUser ID
   */
  async getCredentials(vmUserId) {
    const vmUser = await prisma.vMUser.findUnique({
      where: { id: vmUserId },
      include: { vm: true }
    });

    if (!vmUser) {
      throw new Error("VMUser not found");
    }

    return {
      username: vmUser.linuxUsername,
      password: vmUser.rdpPasswordEnc ? decrypt(vmUser.rdpPasswordEnc) : null,
      subdomain: vmUser.vm.subdomain,
      rdpPort: vmUser.vm.rdpPort,
      status: vmUser.status
    };
  }

  /**
   * Reset a VMUser's password
   * @param {string} vmUserId - VMUser ID
   */
  async resetPassword(vmUserId) {
    const vmUser = await prisma.vMUser.findUnique({
      where: { id: vmUserId },
      include: { vm: true }
    });

    if (!vmUser) {
      throw new Error("VMUser not found");
    }

    const newPassword = generatePassword();

    if (vmUser.vm.status === "RUNNING") {
      // Update password on VM
      await proxmoxService.setLinuxUserPassword(
        vmUser.vm.vmid,
        vmUser.linuxUsername,
        newPassword
      );
    }

    // Update in database
    await prisma.vMUser.update({
      where: { id: vmUserId },
      data: { rdpPasswordEnc: encrypt(newPassword) }
    });

    return { password: newPassword };
  }

  /**
   * Disable a VMUser (keeps record but prevents access)
   * @param {string} vmUserId - VMUser ID
   */
  async disableVMUser(vmUserId) {
    const vmUser = await prisma.vMUser.findUnique({
      where: { id: vmUserId },
      include: { vm: true }
    });

    if (!vmUser) {
      throw new Error("VMUser not found");
    }

    // Lock the Linux account
    if (vmUser.vm.status === "RUNNING") {
      try {
        await proxmoxService.execInVM(
          vmUser.vm.vmid,
          `usermod -L ${vmUser.linuxUsername}`
        );
      } catch (e) {
        console.error(`Failed to lock user ${vmUser.linuxUsername}:`, e.message);
      }
    }

    await prisma.vMUser.update({
      where: { id: vmUserId },
      data: { status: "DISABLED" }
    });

    return { success: true };
  }

  /**
   * Re-enable a disabled VMUser
   * @param {string} vmUserId - VMUser ID
   */
  async enableVMUser(vmUserId) {
    const vmUser = await prisma.vMUser.findUnique({
      where: { id: vmUserId },
      include: { vm: true }
    });

    if (!vmUser) {
      throw new Error("VMUser not found");
    }

    // Unlock the Linux account
    if (vmUser.vm.status === "RUNNING") {
      try {
        await proxmoxService.execInVM(
          vmUser.vm.vmid,
          `usermod -U ${vmUser.linuxUsername}`
        );
      } catch (e) {
        console.error(`Failed to unlock user ${vmUser.linuxUsername}:`, e.message);
      }
    }

    await prisma.vMUser.update({
      where: { id: vmUserId },
      data: { status: "ACTIVE" }
    });

    return { success: true };
  }

  /**
   * Delete a VMUser completely
   * @param {string} vmUserId - VMUser ID
   */
  async deleteVMUser(vmUserId) {
    const vmUser = await prisma.vMUser.findUnique({
      where: { id: vmUserId },
      include: { vm: true }
    });

    if (!vmUser) {
      throw new Error("VMUser not found");
    }

    // Delete Linux user from VM
    if (vmUser.vm.status === "RUNNING") {
      try {
        await proxmoxService.deleteLinuxUser(vmUser.vm.vmid, vmUser.linuxUsername);
      } catch (e) {
        console.error(`Failed to delete Linux user ${vmUser.linuxUsername}:`, e.message);
        // Continue anyway - we want to clean up the database
      }
    }

    // Mark as deleted (soft delete)
    await prisma.vMUser.update({
      where: { id: vmUserId },
      data: { status: "DELETED" }
    });

    return { success: true };
  }

  /**
   * Get all VMUsers for a shared VM
   * @param {string} vmId - VM ID
   */
  async getVMUsers(vmId) {
    const vmUsers = await prisma.vMUser.findMany({
      where: { vmId, status: { not: "DELETED" } },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    return vmUsers.map(vu => ({
      id: vu.id,
      userId: vu.userId,
      userName: vu.user.name,
      userEmail: vu.user.email,
      linuxUsername: vu.linuxUsername,
      status: vu.status,
      createdAt: vu.createdAt
    }));
  }

  /**
   * Get shared VM for a user (finds VM through VMUser)
   * @param {string} userId - User ID
   */
  async getSharedVMForUser(userId) {
    const vmUser = await prisma.vMUser.findFirst({
      where: { userId, status: { in: ["ACTIVE", "PROVISIONING"] } },
      include: {
        vm: {
          include: { org: true }
        }
      }
    });

    if (!vmUser) return null;

    return {
      vm: vmUser.vm,
      vmUser: {
        id: vmUser.id,
        linuxUsername: vmUser.linuxUsername,
        status: vmUser.status
      }
    };
  }
}

module.exports = new VMUserService();
