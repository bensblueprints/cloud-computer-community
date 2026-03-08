# CloudCode Architecture Documentation

## System Overview

CloudCode is a cloud desktop platform that provides virtual Ubuntu environments to users. The system supports three subscription plans:

| Plan | VM Type | Resources | Users |
|------|---------|-----------|-------|
| SOLO | Personal | 8GB RAM, 2 vCPU | 1 |
| TEAM | Shared | 16GB RAM, 4 vCPU | 5 |
| ARMY | Shared | 32GB RAM, 8 vCPU | 25 |

## Resource Model

### SOLO Plan (Personal VM)
- Each user gets their own dedicated VM
- VM is owned by the user (`VM.userId`)
- Full control: start, stop, restart, delete

### TEAM/ARMY Plans (Shared VM)
- Organization gets ONE shared VM
- VM is owned by the organization (`VM.orgId`, `VM.isShared = true`)
- Each team member gets a Linux user account (`VMUser`)
- Multiple users can connect via RDP simultaneously
- Only org OWNER can manage (start/stop/delete) the VM
- Team members can only access their own credentials

## Tech Stack

### Backend
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL via Prisma ORM
- **Queue**: BullMQ + Redis
- **VM Provider**: Proxmox VE (QEMU)
- **Email**: Resend
- **Payments**: Stripe

### Frontend
- **Framework**: React + Vite
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

### Infrastructure
- **Reverse Proxy**: Traefik v3
- **SSL**: Let's Encrypt via Cloudflare
- **VNC Proxy**: noVNC via WebSocket

## User Signup Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GUEST CHECKOUT FLOW                             │
└─────────────────────────────────────────────────────────────────────────┘

1. USER SELECTS PLAN (Homepage)
   └─> POST /api/billing/checkout { plan: "TEAM" }
   └─> Backend creates Stripe checkout session
   └─> User redirected to Stripe

2. STRIPE PAYMENT
   └─> User enters payment details
   └─> 3-day trial starts
   └─> Success redirect: /setup-password?session_id={SESSION_ID}

3. SETUP PASSWORD PAGE
   └─> GET /api/billing/session/{sessionId} → fetches email from Stripe
   └─> User creates password
   └─> POST /api/auth/setup-password { email, password }
   └─> JWT cookie set → User logged in
   └─> Redirect to /dashboard

4. STRIPE WEBHOOK (async, happens in background)
   └─> Event: checkout.session.completed
   └─> Creates User if not exists (with temp password)
   └─> Creates Organization with plan
   └─> Creates Subscription record
   └─> Creates VM record (status: PROVISIONING)
   └─> Queues provisioning job

5. VM PROVISIONING (BullMQ worker)
   └─> Clone template from Proxmox (512/513/514)
   └─> Start VM
   └─> Wait for guest agent (5 min timeout)
   └─> Set credentials (RDP/VNC passwords)
   └─> For shared VMs: Create owner's Linux user + VMUser record
   └─> Create Traefik route
   └─> Update VM status: RUNNING
   └─> Send email notification

6. USER ACCESSES VM
   └─> Dashboard shows VM card with "Launch Browser" button
   └─> Click → Opens /console/{vmid}
   └─> Console fetches VNC token: GET /api/novnc/{vmid}/token
   └─> WebSocket connects to wss://{subdomain}.cloudcode.space/websockify
   └─> Backend proxies to Proxmox VNC websocket
   └─> noVNC displays VM desktop
```

## Team Member Invite Flow

```
1. OWNER SENDS INVITE
   └─> POST /api/org/invite { email }
   └─> Creates Invite record with token
   └─> Sends email with invite link

2. MEMBER ACCEPTS INVITE
   └─> GET /accept-invite/{token}
   └─> POST /api/auth/accept-invite/:token { name, password }
   └─> Creates User with orgId
   └─> Checks for org's shared VM
   └─> Queues addVMUser job

3. VM USER PROVISIONING (async)
   └─> addVMUser worker picks up job
   └─> Creates VMUser record
   └─> Creates Linux user on VM via QEMU guest agent
   └─> Sends credentials email to member
```

## Traefik Routing Architecture

```
                    Internet
                        │
                        ▼
              ┌─────────────────┐
              │   Cloudflare    │
              │ (SSL termination)│
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │    Traefik      │
              │  (reverse proxy)│
              └────────┬────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ cloudcode.  │ │ {subdomain} │ │ {subdomain} │
│ space/*     │ │ /websockify │ │ /*          │
└─────┬───────┘ └─────┬───────┘ └─────┬───────┘
      │               │               │
      ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Frontend   │ │  Backend    │ │  Redirect   │
│  (React)    │ │  :6080      │ │  to console │
│  :80        │ │  websockify │ │             │
└─────────────┘ └─────────────┘ └─────────────┘
```

### Traefik Dynamic Config per VM

File: `/etc/traefik/dynamic/vm-{vmid}.yml`

```yaml
http:
  routers:
    vm-{vmid}-ws:           # WebSocket route (priority: 100)
      rule: Host(`{subdomain}.cloudcode.space`) && PathPrefix(`/websockify`)
      entryPoints: [websecure]
      service: websockify-proxy
      tls: { certResolver: letsencrypt }
      priority: 100
    vm-{vmid}:              # Redirect route (priority: 1)
      rule: Host(`{subdomain}.cloudcode.space`)
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
```

## Database Schema

### Core Models

```
User
├── id (UUID)
├── email (unique)
├── passwordHash
├── name
├── orgId (FK → Organization)
├── orgRole (OWNER | MEMBER)
├── siteRole (MEMBER | ADMIN)
└── vms[] (personal VMs)
    vmUsers[] (access to shared VMs)

Organization
├── id (UUID)
├── name
├── ownerId (FK → User)
├── plan (SOLO | TEAM | ARMY)
├── seatLimit
├── members[] (FK → User)
├── subscription
└── sharedVMs[] (shared VMs)

VM
├── id (UUID)
├── vmid (Proxmox ID)
├── userId (FK → User, nullable for shared)
├── orgId (FK → Organization, for shared)
├── isShared (boolean)
├── subdomain
├── status (PROVISIONING | RUNNING | STOPPED | SUSPENDED | ERROR | DELETED)
├── internalIp
├── rdpPasswordEnc (for personal VMs)
├── vncPasswordEnc
└── vmUsers[] (for shared VMs)

VMUser
├── id (UUID)
├── vmId (FK → VM)
├── userId (FK → User)
├── linuxUsername
├── rdpPasswordEnc
├── status (PROVISIONING | ACTIVE | DISABLED | DELETED)
└── createdAt

Subscription
├── id (UUID)
├── orgId (FK → Organization)
├── plan
├── stripeId
├── status
├── renewsAt
└── cancelAt
```

## Proxmox Templates

| VMID | Plan | Resources |
|------|------|-----------|
| 111 | SOLO | 8GB RAM, 2 vCPU, 40GB disk |
| 112 | TEAM | 16GB RAM, 4 vCPU, 80GB disk |
| 113 | ARMY | 32GB RAM, 8 vCPU, 160GB disk |

### Template Requirements

1. Ubuntu Desktop with Xfce4
2. QEMU Guest Agent installed and running
3. xrdp installed and enabled
4. For TEAM/ARMY templates:
   - Multi-session xrdp config (`/etc/xrdp/sesman.ini`)
   - MaxSessions set appropriately (5 for TEAM, 25 for ARMY)

## API Endpoints

### Auth
- `POST /api/auth/register` - New user registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/setup-password` - Set password after Stripe checkout
- `POST /api/auth/accept-invite/:token` - Accept team invite
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `PUT /api/auth/change-password` - Change password (logged in)
- `DELETE /api/auth/account` - Delete account

### Billing
- `GET /api/billing/plans` - Get available plans
- `POST /api/billing/checkout` - Create Stripe checkout session
- `GET /api/billing/session/:sessionId` - Get checkout session email
- `POST /api/billing/subscribe` - Subscribe (logged in users)
- `GET /api/billing/portal` - Get Stripe portal URL
- `POST /api/billing/cancel` - Cancel subscription
- `POST /api/billing/reactivate` - Reactivate cancelled subscription
- `POST /api/billing/webhook` - Stripe webhook handler

### VMs
- `GET /api/vms` - List user's VMs (personal + shared)
- `POST /api/vms` - Create new VM
- `GET /api/vms/:id` - Get VM details
- `POST /api/vms/:id/start` - Start VM
- `POST /api/vms/:id/stop` - Stop VM
- `POST /api/vms/:id/restart` - Restart VM
- `DELETE /api/vms/:id` - Delete VM
- `GET /api/vms/:id/credentials` - Get VM/VMUser credentials
- `POST /api/vms/:id/reset-password` - Reset passwords
- `GET /api/vms/:id/rdp-file` - Download RDP file

### Organization
- `GET /api/org` - Get organization details
- `GET /api/org/members` - List members
- `POST /api/org/invite` - Invite member
- `DELETE /api/org/members/:userId` - Remove member

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Proxmox
PROXMOX_HOST=https://proxmox.example.com:8006
PROXMOX_NODE=pve
PROXMOX_USER=api@pve
PROXMOX_TOKEN_ID=apitoken
PROXMOX_TOKEN_SECRET=...
PROXMOX_TEMPLATE_SOLO=512
PROXMOX_TEMPLATE_TEAM=513
PROXMOX_TEMPLATE_ARMY=514

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_SOLO=price_...
STRIPE_PRICE_TEAM=price_...
STRIPE_PRICE_ARMY=price_...

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@advancedmarketing.co

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=...

# Frontend URL
FRONTEND_URL=https://cloudcode.space

# Encryption
ENCRYPTION_KEY=32-character-encryption-key
```
