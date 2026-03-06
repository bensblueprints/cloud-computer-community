const fs = require('fs');
const path = require('path');

const TRAEFIK_DYNAMIC_DIR = process.env.TRAEFIK_DYNAMIC_DIR || '/etc/traefik/dynamic';

class TraefikService {
  constructor() {
    this.ensureDirectory();
    this.createWebsockifyService();
  }

  ensureDirectory() {
    try {
      if (!fs.existsSync(TRAEFIK_DYNAMIC_DIR)) {
        fs.mkdirSync(TRAEFIK_DYNAMIC_DIR, { recursive: true });
      }
    } catch (e) {
      console.error('Failed to create Traefik dynamic dir:', e);
    }
  }

  createRoute(vmid, subdomain, internalIp, novncPort = 6080) {
    try {
      const configPath = path.join(TRAEFIK_DYNAMIC_DIR, `vm-${vmid}.yml`);
      const fullSubdomain = subdomain.includes('.') ? subdomain : `${subdomain}.cloudcode.space`;

      // Route subdomain root to frontend console page, websockify path to backend proxy
      const config = `http:
  routers:
    vm-${vmid}:
      rule: "Host(\`${fullSubdomain}\`) && !PathPrefix(\`/websockify\`)"
      entryPoints:
        - websecure
      middlewares:
        - vm-${vmid}-redirect
      service: frontend
      tls:
        certResolver: letsencrypt
    vm-${vmid}-ws:
      rule: "Host(\`${fullSubdomain}\`) && PathPrefix(\`/websockify\`)"
      entryPoints:
        - websecure
      service: websockify-proxy
      tls:
        certResolver: letsencrypt
  middlewares:
    vm-${vmid}-redirect:
      redirectRegex:
        regex: '^https://${fullSubdomain.replace(/\./g, '\\\\.')}/?$$'
        replacement: 'https://cloudcode.space/console/${vmid}'
        permanent: false
`;

      fs.writeFileSync(configPath, config);
      console.log(`Created Traefik route for VM ${vmid} at ${fullSubdomain}`);
      return configPath;
    } catch (e) {
      console.error(`Failed to create Traefik route for VM ${vmid}:`, e);
    }
  }

  deleteRoute(vmid) {
    try {
      const configPath = path.join(TRAEFIK_DYNAMIC_DIR, `vm-${vmid}.yml`);
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
        console.log(`Deleted Traefik route for VM ${vmid}`);
      }
    } catch (e) {
      console.error(`Failed to delete Traefik route for VM ${vmid}:`, e);
    }
  }

  createWebsockifyService() {
    try {
      const configPath = path.join(TRAEFIK_DYNAMIC_DIR, 'websockify.yml');
      const config = `http:
  services:
    websockify-proxy:
      loadBalancer:
        servers:
          - url: "http://backend:6080"
`;
      fs.writeFileSync(configPath, config);
      console.log('Created websockify proxy service config');
    } catch (e) {
      console.error('Failed to create websockify service:', e);
    }
  }
}

module.exports = new TraefikService();
