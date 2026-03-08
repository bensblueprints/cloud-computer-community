# CloudCode.space - System Architecture & Operations Guide

## Overview

CloudCode.space is a cloud VM provisioning platform that provides Ubuntu desktop environments via browser-based VNC. Users pay via Stripe, and VMs are automatically provisioned on Proxmox.

---

## 1. INFRASTRUCTURE - WHERE EVERYTHING LIVES

### Server
| Component | Location |
|-----------|----------|
| Physical Server | OVH Dedicated: `51.161.172.76` |
| SSH Access | `ssh ovh-dedicated` (key: ~/.ssh/ovh_small) |
| Proxmox UI | https://51.161.172.76:8006 |

### Docker Services (docker-compose.yml)
```
/root/cloud-computer-community/
├── docker-compose.yml        # Orchestrates all services
├── .env                      # Configuration (SENSITIVE)
├── traefik/                  # Reverse proxy config
├── frontend/                 # React + Vite → Nginx
└── backend/                  # Node.js + Express + Prisma
```

| Service | Port | Purpose |
|---------|------|---------|
| Traefik | 80, 443 | Reverse proxy, SSL, routing |
| Frontend | 80 (internal) | React app served by Nginx |
| Backend | 3001, 6080 | API + WebSocket VNC proxy |
| PostgreSQL | 5432 (localhost) | Database |
| Redis | 6379 (localhost) | Job queue + cache |

### URLs
| URL | Serves |
|-----|--------|
| `cloudcode.space` | Landing page (Frontend) |
| `app.cloudcode.space` | Dashboard (Frontend) |
| `api.cloudcode.space` | REST API (Backend) |
| `{user}-{vmid}.cloudcode.space` | VM VNC connection |

### GitHub Repo
```
https://github.com/bensblueprints/cloud-computer-community
```

---

## 2. USER FLOW: PAYMENT → RUNNING DESKTOP

```
[1] User visits cloudcode.space
         ↓
[2] Selects plan (SOLO $19 / TEAM $79 / ARMY $299)
         ↓
[3] Stripe checkout (POST /api/billing/checkout)
         ↓
[4] Payment processed → Stripe webhook fires
         ↓
[5] Backend receives webhook (POST /api/billing/webhook)
         ↓
[6] Creates: User → Organization → Subscription → VM record
         ↓
[7] Queues BullMQ job → Redis
         ↓
[8] Worker clones Proxmox template (5-10 min)
         ↓
[9] Starts VM, waits for boot, sets credentials
         ↓
[10] Creates Traefik route for subdomain
         ↓
[11] Updates VM status to RUNNING
         ↓
[12] Sends email: "Your environment is ready"
         ↓
[13] User clicks link → VNC desktop in browser
```

---

## 3. STRIPE INTEGRATION - FILES & CONFIGURATION

### Files That Handle Stripe
| File | Purpose | Lines |
|------|---------|-------|
| `backend/src/routes/billing.js` | Checkout + webhooks | 431-679 |
| `backend/.env` | Stripe keys | - |

### Environment Variables (Stripe-Related)
```bash
# Current Stripe Account
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (per plan)
STRIPE_PRICE_SOLO=price_...
STRIPE_PRICE_TEAM=price_...
STRIPE_PRICE_ARMY=price_...
```

### Webhook Events Handled
| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create user, subscription, queue VM |
| `customer.subscription.updated` | Update status, suspend/unsuspend CRM |
| `customer.subscription.deleted` | Suspend all VMs |

### To Switch Stripe Accounts
1. Create new products/prices in new Stripe dashboard
2. Update `.env` on server:
   ```bash
   ssh ovh-dedicated
   cd /root/cloud-computer-community
   nano .env  # Update 6 Stripe variables
   ```
3. Update webhook endpoint in new Stripe dashboard:
   - URL: `https://api.cloudcode.space/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Restart backend:
   ```bash
   docker-compose restart backend
   ```

---

## 4. FILES TO FREEZE (STOP UPDATING)

Once the system is working, these files should NOT be modified without careful consideration:

### CRITICAL - DO NOT MODIFY
| File | Why |
|------|-----|
| `backend/.env` | Contains all secrets (Stripe, Proxmox, DB) |
| `backend/prisma/schema.prisma` | Database schema - changes require migrations |
| `backend/src/jobs/provisionVM.js` | Core provisioning logic - breaks VM creation |
| `backend/src/services/ProxmoxService.js` | Proxmox API calls - breaks VM operations |
| `docker-compose.yml` | Service orchestration - breaks everything |
| `traefik/traefik.yml` | Routing config - breaks SSL/access |

### SAFE TO MODIFY
| File | Why |
|------|-----|
| `frontend/src/**` | UI changes, no backend impact |
| `backend/src/routes/*.js` (except billing.js) | API endpoints |
| `traefik/dynamic/vm-*.yml` | Auto-generated, recreated per VM |

### MODIFY WITH CAUTION
| File | Risk |
|------|------|
| `backend/src/routes/billing.js` | Breaks payments if wrong |
| `backend/src/services/TraefikService.js` | Breaks subdomain routing |
| `backend/src/middleware/auth.js` | Breaks authentication |

---

## 5. PROXMOX TEMPLATES

### Template IDs
| Plan | Template VMID | Specs |
|------|---------------|-------|
| SOLO | 512 | 8GB RAM, 2 vCPU, 40GB |
| TEAM | 513 | 16GB RAM, 4 vCPU, 80GB |
| ARMY | 514 | 32GB RAM, 8 vCPU, 160GB |

### Template Configuration
- OS: Ubuntu 24.04 with GNOME
- Pre-installed: Chrome, Firefox, Cursor, Slack, Telegram, Claude Code CLI
- Guest Agent: QEMU agent installed and running
- VNC: x11vnc configured on port 5900
- noVNC: Web server on port 6080

### Environment Variables
```bash
PROXMOX_HOST=https://51.161.172.76:8006
PROXMOX_USER=root@pam
PROXMOX_TOKEN_ID=terraform
PROXMOX_TOKEN_SECRET=...
PROXMOX_NODE=pve
PROXMOX_TEMPLATE_SOLO=512
PROXMOX_TEMPLATE_TEAM=513
PROXMOX_TEMPLATE_ARMY=514
```

---

## 6. DATABASE SCHEMA (Key Tables)

```
User
├── id, email, name, passwordHash
├── orgId (belongs to Organization)
└── orgRole (OWNER or MEMBER)

Organization
├── id, name, ownerId
├── plan (SOLO/TEAM/ARMY)
└── seatLimit (1/5/25)

Subscription
├── id, orgId, plan
├── stripeId (Stripe subscription ID)
├── status (active/past_due/canceled)
└── renewsAt, cancelAt

VM
├── id, vmid (Proxmox ID)
├── userId (personal) OR orgId (shared)
├── isShared (true for TEAM/ARMY)
├── status (PROVISIONING/RUNNING/STOPPED/SUSPENDED/ERROR)
├── subdomain (e.g., "ben-12345")
└── internalIp, rdpPasswordEnc, vncPasswordEnc

VMUser (for shared VMs)
├── vmId, userId
├── linuxUsername, rdpPasswordEnc
└── status (PROVISIONING/ACTIVE/DISABLED)
```

---

## 7. DEPLOYMENT COMMANDS

### SSH to Server
```bash
ssh ovh-dedicated
cd /root/cloud-computer-community
```

### View Logs
```bash
docker logs cloud-computer-community_backend_1 -f
docker logs cloud-computer-community_frontend_1 -f
docker logs cloud-computer-community_traefik_1 -f
```

### Restart Services
```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose up -d --build  # Full rebuild
```

### Deploy Frontend Changes
```bash
# Local machine
cd frontend && npm run build
rsync -avz --delete dist/ ovh-dedicated:/root/cloud-computer-community/frontend/dist/
ssh ovh-dedicated "cd /root/cloud-computer-community && docker-compose restart frontend"
```

### Deploy Backend Changes
```bash
# Local machine
rsync -avz --delete backend/ ovh-dedicated:/root/cloud-computer-community/backend/ \
  --exclude node_modules --exclude .env
ssh ovh-dedicated "cd /root/cloud-computer-community && docker-compose up -d --build backend"
```

### Database Operations
```bash
# Run migrations
ssh ovh-dedicated "cd /root/cloud-computer-community && docker-compose exec backend npx prisma migrate deploy"

# Open Prisma Studio
ssh ovh-dedicated "cd /root/cloud-computer-community && docker-compose exec backend npx prisma studio"
```

---

## 8. TROUBLESHOOTING

### VM Stuck in PROVISIONING
```bash
# Check job queue
ssh ovh-dedicated "docker exec -it cloud-computer-community_backend_1 node -e \"
const Queue = require('bullmq').Queue;
const q = new Queue('vm-provisioning', { connection: { host: 'localhost' } });
q.getJobs(['waiting', 'active', 'failed']).then(j => console.log(j));
\""

# Manual retry
POST /api/vms/{vmId}/retry-access
```

### Stripe Webhook Not Firing
1. Check webhook endpoint in Stripe dashboard
2. Verify STRIPE_WEBHOOK_SECRET matches
3. Check backend logs for signature errors
4. Test with Stripe CLI: `stripe listen --forward-to localhost:3001/api/billing/webhook`

### VNC Connection Failed
1. Check VM is RUNNING in database
2. Verify Traefik route exists: `ls /etc/traefik/dynamic/vm-{vmid}.yml`
3. Check WebSocket proxy logs
4. Verify QEMU guest agent is running in VM

---

## 9. SWITCHING STRIPE ACCOUNTS (Step-by-Step)

### 1. In NEW Stripe Dashboard
- Create 3 products: Solo, Team, Army
- Create monthly prices for each
- Copy: Secret Key, Publishable Key
- Create webhook endpoint:
  - URL: `https://api.cloudcode.space/api/billing/webhook`
  - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copy: Webhook Signing Secret

### 2. Update Server .env
```bash
ssh ovh-dedicated
cd /root/cloud-computer-community
nano .env

# Replace these 6 values:
STRIPE_SECRET_KEY=sk_live_NEW...
STRIPE_PUBLISHABLE_KEY=pk_live_NEW...
STRIPE_WEBHOOK_SECRET=whsec_NEW...
STRIPE_PRICE_SOLO=price_NEW...
STRIPE_PRICE_TEAM=price_NEW...
STRIPE_PRICE_ARMY=price_NEW...
```

### 3. Restart Backend
```bash
docker-compose restart backend
```

### 4. Test
- Create test checkout
- Verify webhook received (check logs)
- Verify VM provisioning starts

---

## 10. ENSURING WEBHOOK → VM PROVISIONING WORKS

### Checklist
- [ ] Stripe webhook endpoint configured correctly
- [ ] STRIPE_WEBHOOK_SECRET matches Stripe dashboard
- [ ] Backend can reach Proxmox API (PROXMOX_HOST reachable)
- [ ] Proxmox templates exist (512, 513, 514)
- [ ] Redis running (for BullMQ job queue)
- [ ] PostgreSQL running (for database)
- [ ] Traefik can write to /etc/traefik/dynamic/

### Quick Test Command
```bash
# Create test account (bypasses Stripe)
curl -X POST https://api.cloudcode.space/api/billing/test-account \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "plan": "SOLO",
    "testCode": "$TEST_ACCOUNT_SECRET"
  }'
```

---

## 11. MONITORING

### Health Check
```bash
curl https://api.cloudcode.space/health
# Should return: { "status": "ok", "timestamp": "..." }
```

### VM Status
```bash
# List all VMs in database
ssh ovh-dedicated "docker exec cloud-computer-community_backend_1 npx prisma db execute --stdin" <<< "SELECT vmid, status, subdomain FROM \"VM\" ORDER BY \"createdAt\" DESC LIMIT 10;"
```

### Proxmox Status
```bash
ssh ovh-dedicated "qm list"  # QEMU VMs
ssh ovh-dedicated "pct list" # LXC containers
```

---

## 12. PRICING PLANS

| Plan | Price | RAM | CPU | Storage | Seats |
|------|-------|-----|-----|---------|-------|
| Solo | $19/mo | 8GB | 2 vCPU | 40GB SSD | 1 |
| Team | $79/mo | 16GB | 4 vCPU | 80GB SSD | 5 |
| Army | $299/mo | 32GB | 8 vCPU | 160GB SSD | 25 |

---

## 13. DEFAULT CREDENTIALS

### VM Login
- **Username:** `advanced-marketing-admin` (or generated from user's name)
- **Password:** `cloudcode123` (users should change via `passwd` command)

### Proxmox Templates
All templates use the same base credentials, which are reset per-VM during provisioning.
