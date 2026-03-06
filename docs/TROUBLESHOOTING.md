# CloudCode Troubleshooting Guide

## Common Issues and Solutions

### VM Stuck in PROVISIONING

**Symptoms:**
- Dashboard shows VM with spinning indicator
- Status never changes to RUNNING
- User cannot access their VM

**Causes:**
1. Clone task failed in Proxmox
2. VM failed to start
3. Guest agent not responding
4. Traefik route creation failed

**Solutions:**

1. **Check the provisioning job logs:**
```bash
ssh ovh-dedicated "docker logs cloud-computer-community_backend_1 2>&1 | grep -i provision | tail -50"
```

2. **Check Proxmox for the VM:**
```bash
ssh ovh-dedicated "qm list | grep {vmid}"
```

3. **Clean up stuck VM records:**
```sql
-- Connect to database
DELETE FROM "VM" WHERE status IN ('PROVISIONING', 'ERROR')
  AND "createdAt" < NOW() - INTERVAL '1 hour';
```

4. **Re-provision VM manually:**
```javascript
// Run in backend console or create API endpoint
const { Queue } = require('bullmq');
const provisionQueue = new Queue('vm-provisioning', { connection: redis });

await provisionQueue.add('provision', {
  userId: 'xxx-xxx-xxx',
  orgId: 'xxx-xxx-xxx',
  vmId: 'xxx-xxx-xxx',
  vmid: 99999,
  templateVmid: 111,  // or 112/113 for TEAM/ARMY
  subdomain: 'username-99999',
  username: 'username',
  isShared: false,  // true for TEAM/ARMY
  plan: 'SOLO'  // or TEAM/ARMY
});
```

---

### Webhook Not Processing

**Symptoms:**
- User paid but no account created
- Subscription shows in Stripe but not in database
- VM not provisioned after checkout

**Causes:**
1. Webhook signature verification failed
2. Webhook URL misconfigured in Stripe
3. Backend not receiving webhook requests

**Solutions:**

1. **Check Stripe webhook logs:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Check recent events and their responses

2. **Verify webhook secret:**
```bash
ssh ovh-dedicated "cat /root/cloud-computer-community/.env | grep STRIPE_WEBHOOK"
```

3. **Test webhook endpoint:**
```bash
curl -X POST https://api.cloudcode.space/billing/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
# Should return 400 (signature verification failed) not 404
```

4. **Manually create user/subscription:**
```sql
-- Get customer email from Stripe dashboard, then:
INSERT INTO "User" (id, email, name, "passwordHash", "orgRole")
VALUES (gen_random_uuid(), 'user@email.com', 'User Name', 'NEEDS_RESET', 'OWNER');

-- Then direct user to /forgot-password to set their password
```

---

### Guest Agent Not Ready

**Symptoms:**
- VM shows as RUNNING but credentials not set
- "Default Password: SErver777" shown to user
- Remote access panel shows no credentials

**Causes:**
1. Guest agent not installed in template
2. Guest agent service not running
3. Network issues between Proxmox and VM

**Solutions:**

1. **Check if guest agent is running in VM:**
```bash
# Access VM console via Proxmox web UI
systemctl status qemu-guest-agent
```

2. **Start guest agent:**
```bash
sudo systemctl enable qemu-guest-agent
sudo systemctl start qemu-guest-agent
```

3. **User can set password manually:**
   - Access VM via noVNC console
   - Open terminal
   - Run `passwd` to change password

---

### Traefik Route Missing

**Symptoms:**
- Subdomain returns 404 or connection refused
- noVNC console doesn't connect
- Direct access to VM fails

**Solutions:**

1. **Check if route file exists:**
```bash
ssh ovh-dedicated "ls -la /etc/traefik/dynamic/vm-{vmid}.yml"
```

2. **Create route manually:**
```bash
ssh ovh-dedicated "cat > /etc/traefik/dynamic/vm-{vmid}.yml << 'EOF'
http:
  routers:
    vm-{vmid}-ws:
      rule: Host(\`{subdomain}.cloudcode.space\`) && PathPrefix(\`/websockify\`)
      entryPoints: [websecure]
      service: websockify-proxy
      tls: { certResolver: letsencrypt }
      priority: 100
    vm-{vmid}:
      rule: Host(\`{subdomain}.cloudcode.space\`)
      entryPoints: [websecure]
      middlewares: [vm-{vmid}-redirect]
      service: frontend
      tls: { certResolver: letsencrypt }
      priority: 1
  middlewares:
    vm-{vmid}-redirect:
      redirectRegex:
        regex: .*
        replacement: https://cloudcode.space/console/{vmid}
        permanent: false
EOF"
```

3. **Reload Traefik:**
```bash
ssh ovh-dedicated "docker-compose restart traefik"
```

---

### noVNC Won't Connect

**Symptoms:**
- Console page loads but shows connection error
- WebSocket errors in browser console
- "Connection closed" message

**Causes:**
1. VM not running in Proxmox
2. VNC proxy not available
3. WebSocket route not working

**Solutions:**

1. **Verify VM is running:**
```bash
ssh ovh-dedicated "qm status {vmid}"
```

2. **Test VNC proxy manually:**
```bash
ssh ovh-dedicated "curl -k https://localhost:8006/api2/json/nodes/pve/qemu/{vmid}/vncproxy -X POST"
```

3. **Check WebSocket proxy in backend logs:**
```bash
ssh ovh-dedicated "docker logs cloud-computer-community_backend_1 2>&1 | grep websock"
```

---

### Email Not Found on Setup

**Symptoms:**
- After Stripe checkout, setup-password page shows "User not found"
- Session ID doesn't return email

**Causes:**
1. Webhook hasn't processed yet (race condition)
2. Webhook failed silently
3. Email mismatch between checkout and lookup

**Solutions:**

1. **Wait and retry:**
   - Webhook can take a few seconds to process
   - Refresh the page after 10-30 seconds

2. **Check if user was created:**
```sql
SELECT * FROM "User" WHERE email = 'customer@email.com';
```

3. **Manually fetch email from Stripe session:**
```bash
curl https://api.stripe.com/v1/checkout/sessions/{session_id} \
  -u sk_live_xxx: \
  | jq '.customer_details.email'
```

---

### Team Member Can't Access Shared VM

**Symptoms:**
- Member invited and accepted invite
- Dashboard shows shared VM
- "Access being set up" message never resolves

**Causes:**
1. addVMUser job failed
2. VM not running when member joined
3. VMUser stuck in PROVISIONING

**Solutions:**

1. **Check VMUser status:**
```sql
SELECT * FROM "VMUser" WHERE "userId" = 'xxx';
```

2. **Check addVMUser job logs:**
```bash
ssh ovh-dedicated "docker logs cloud-computer-community_backend_1 2>&1 | grep addVMUser"
```

3. **Manually provision VMUser:**
```javascript
const vmUserService = require('./src/services/VMUserService');
await vmUserService.provisionVMUser('vmuser-id');
```

4. **Create Linux user directly:**
```bash
# In Proxmox, access VM via console
sudo useradd -m -s /bin/bash {username}
echo "{username}:{password}" | sudo chpasswd
sudo usermod -aG sudo,users {username}
```

---

### Subscription Not Canceling

**Symptoms:**
- User clicks cancel but subscription remains active
- Stripe shows subscription cancelled but VMs not suspended

**Solutions:**

1. **Check subscription status in database:**
```sql
SELECT * FROM "Subscription" WHERE "orgId" = 'xxx';
```

2. **Manually update subscription:**
```sql
UPDATE "Subscription"
SET status = 'canceled', "cancelAt" = NOW()
WHERE id = 'xxx';

UPDATE "VM"
SET status = 'SUSPENDED'
WHERE "orgId" = 'xxx' AND status = 'RUNNING';
```

---

## Database Maintenance

### Clean Up Orphaned Records

```sql
-- Remove VMs without users or orgs
DELETE FROM "VM" WHERE "userId" IS NULL AND "orgId" IS NULL;

-- Remove VMUsers for deleted VMs
DELETE FROM "VMUser" WHERE "vmId" NOT IN (SELECT id FROM "VM");

-- Remove expired invites
DELETE FROM "Invite" WHERE "expiresAt" < NOW() - INTERVAL '7 days';
```

### Reset User Password

```sql
-- Set temporary password hash (user will need to reset via forgot-password)
UPDATE "User"
SET "passwordHash" = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.XXXXXXXXXXXXXXXX',
    "passwordResetToken" = NULL,
    "passwordResetExpires" = NULL
WHERE email = 'user@email.com';
```

---

## Proxmox Maintenance

### List All VMs

```bash
ssh ovh-dedicated "qm list"
```

### Force Stop a VM

```bash
ssh ovh-dedicated "qm stop {vmid} --forceStop"
```

### Delete a VM

```bash
ssh ovh-dedicated "qm destroy {vmid} --purge"
```

### Check VM Console

```bash
# Open in browser
https://51.161.172.76:8006/#v1:0:qemu/{vmid}:=console
```

---

## Docker Maintenance

### Restart All Services

```bash
ssh ovh-dedicated "cd /root/cloud-computer-community && docker-compose restart"
```

### View All Logs

```bash
ssh ovh-dedicated "docker-compose logs --tail=100 -f"
```

### Rebuild After Code Changes

```bash
ssh ovh-dedicated "cd /root/cloud-computer-community && git pull && docker-compose up -d --build"
```

### Clear Redis Queue

```bash
ssh ovh-dedicated "docker exec cloud-computer-community_redis_1 redis-cli FLUSHALL"
```

---

## Quick Reference Commands

```bash
# SSH to server
ssh ovh-dedicated

# Check running services
docker ps

# View backend logs
docker logs cloud-computer-community_backend_1 -f --tail=100

# Access database
docker exec -it cloud-computer-community_postgres_1 psql -U cloudcomputer

# List VMs in Proxmox
qm list

# Check VM status
qm status {vmid}

# View Traefik routes
ls /etc/traefik/dynamic/

# Test API endpoint
curl https://api.cloudcode.space/auth/me -H "Cookie: token=xxx"

# Restart specific service
docker-compose restart backend
```
