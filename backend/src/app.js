require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const url = require('url');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const vmRoutes = require('./routes/vms');
const novncRoutes = require('./routes/novnc');
const orgRoutes = require('./routes/org');
const billingRoutes = require('./routes/billing');
const adminRoutes = require('./routes/admin');
const provisionWorker = require('./jobs/provisionVM');
const traefikService = require('./services/TraefikService');
const proxmoxService = require('./services/ProxmoxService');

const prisma = new PrismaClient();
const app = express();

app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
// Skip JSON parsing for Stripe webhook (needs raw body for signature verification)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/billing/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/vms', vmRoutes);
app.use('/api/novnc', novncRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

const server = http.createServer(app);

// WebSocket proxy for VNC - connects to Proxmox VNC websocket
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const pathname = url.parse(request.url).pathname;

  if (pathname === '/websockify') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', async (ws, req) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    const token = parsedUrl.query.token;

    if (!token) {
      console.log('WebSocket: No token');
      ws.close(1008, 'No token');
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.log('WebSocket: Invalid token');
      ws.close(1008, 'Invalid token');
      return;
    }

    const { vmid, proxmoxTicket, proxmoxPort } = decoded;

    // Use the ticket from the JWT token (same one frontend received)
    if (!proxmoxTicket || !proxmoxPort) {
      console.error('WebSocket: Missing proxmox ticket/port in token');
      ws.close(1011, 'Invalid token data');
      return;
    }

    const proxmoxHost = process.env.PROXMOX_HOST.replace('https://', '').replace(':8006', '');
    const vncUrl = `wss://${proxmoxHost}:8006/api2/json/nodes/${process.env.PROXMOX_NODE}/qemu/${vmid}/vncwebsocket?port=${proxmoxPort}&vncticket=${encodeURIComponent(proxmoxTicket)}`;

    console.log(`WebSocket: Connecting to Proxmox VNC for VM ${vmid}`);

    // Connect to Proxmox VNC websocket with API token auth
    const proxmoxWs = new WebSocket(vncUrl, {
      rejectUnauthorized: false,
      headers: {
        'Authorization': `PVEAPIToken=${process.env.PROXMOX_USER}!${process.env.PROXMOX_TOKEN_ID}=${process.env.PROXMOX_TOKEN_SECRET}`
      }
    });

    proxmoxWs.on('open', () => {
      console.log(`WebSocket: Connected to Proxmox VNC for VM ${vmid}`);
    });

    proxmoxWs.on('message', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    proxmoxWs.on('error', (err) => {
      console.error(`WebSocket: Proxmox VNC error for VM ${vmid}:`, err.message);
      ws.close(1011, 'VNC error');
    });

    proxmoxWs.on('close', () => {
      console.log(`WebSocket: Proxmox VNC closed for VM ${vmid}`);
      ws.close();
    });

    ws.on('message', (data) => {
      if (proxmoxWs.readyState === WebSocket.OPEN) {
        proxmoxWs.send(data);
      }
    });

    ws.on('close', () => {
      console.log(`WebSocket: Client disconnected for VM ${vmid}`);
      proxmoxWs.close();
    });

    ws.on('error', (err) => {
      console.error(`WebSocket: Client error for VM ${vmid}:`, err.message);
      proxmoxWs.close();
    });

  } catch (err) {
    console.error('WebSocket: Connection error:', err);
    ws.close(1011, 'Server error');
  }
});

// Also listen on port 6080 for Traefik websockify routing
const wsServer = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('WebSocket Proxy');
});

const wss2 = new WebSocket.Server({ server: wsServer });

wss2.on('connection', async (ws, req) => {
  // Same logic as above
  try {
    const parsedUrl = url.parse(req.url, true);
    const token = parsedUrl.query.token;

    if (!token) {
      ws.close(1008, 'No token');
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      ws.close(1008, 'Invalid token');
      return;
    }

    const { vmid, proxmoxTicket, proxmoxPort } = decoded;

    if (!proxmoxTicket || !proxmoxPort) {
      console.error('WS2: Missing proxmox ticket/port in token');
      ws.close(1011, 'Invalid token data');
      return;
    }

    const proxmoxHost = process.env.PROXMOX_HOST.replace('https://', '').replace(':8006', '');
    const vncUrl = `wss://${proxmoxHost}:8006/api2/json/nodes/${process.env.PROXMOX_NODE}/qemu/${vmid}/vncwebsocket?port=${proxmoxPort}&vncticket=${encodeURIComponent(proxmoxTicket)}`;

    const proxmoxWs = new WebSocket(vncUrl, {
      rejectUnauthorized: false,
      headers: {
        'Authorization': `PVEAPIToken=${process.env.PROXMOX_USER}!${process.env.PROXMOX_TOKEN_ID}=${process.env.PROXMOX_TOKEN_SECRET}`
      }
    });

    proxmoxWs.on('open', () => console.log(`WS2: Connected to Proxmox VNC for VM ${vmid}`));
    proxmoxWs.on('message', (data) => ws.readyState === WebSocket.OPEN && ws.send(data));
    proxmoxWs.on('error', (err) => { console.error(`WS2: VNC error:`, err.message); ws.close(1011); });
    proxmoxWs.on('close', () => ws.close());

    ws.on('message', (data) => proxmoxWs.readyState === WebSocket.OPEN && proxmoxWs.send(data));
    ws.on('close', () => proxmoxWs.close());
    ws.on('error', () => proxmoxWs.close());

  } catch (err) {
    console.error('WS2 error:', err);
    ws.close(1011);
  }
});

const PORT = process.env.PORT || 3001;
const WS_PORT = 6080;

server.listen(PORT, () => {
  console.log(`Cloud Computer API running on port ${PORT}`);
});

wsServer.listen(WS_PORT, () => {
  console.log(`WebSocket proxy running on port ${WS_PORT}`);
});

module.exports = app;
