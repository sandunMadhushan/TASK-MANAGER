# 3 — Backend on AWS Free Tier (EC2)

This guide deploys the **Express API** on an **AWS EC2 free tier** instance (`t2.micro`/`t3.micro`) using:

- **Node.js** runtime
- **PM2** to keep the server running
- **Nginx** as reverse proxy on ports 80/443
- **Let’s Encrypt** SSL

## Prerequisites

- GitHub repo pushed (any branch you chose for production — see [00-git-branch-strategy.md](./00-git-branch-strategy.md)).
- `MONGODB_URI` from Atlas ([02-mongodb-atlas.md](./02-mongodb-atlas.md)).
- A long random string for `AUTH_JWT_SECRET` (for example `openssl rand -hex 32` locally).
- AWS account with free-tier-eligible EC2.
- Optional but recommended: a domain name (Route 53 or any DNS provider).

## Launch EC2 (Ubuntu 22.04)

1. AWS Console → **EC2** → **Launch instance**.
2. AMI: **Ubuntu Server 22.04 LTS**.
3. Instance type: **t2.micro** (or **t3.micro**) free-tier eligible.
4. Key pair: create/download `.pem`.
5. Security group inbound rules:
   - `22` (SSH) from your IP
   - `80` (HTTP) from `0.0.0.0/0`
   - `443` (HTTPS) from `0.0.0.0/0`
6. Launch and note the **Public IPv4** and (optional) **Elastic IP**.

## Connect and install dependencies

```bash
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx
sudo npm install -g pm2
node -v
npm -v
```

## Pull project and install

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
git checkout YOUR_DEPLOY_BRANCH
npm install
```

## Create production environment file

Create `server/.env.production`:

```bash
nano server/.env.production
```

Minimum values:

```text
NODE_ENV=production
PORT=4000
MONGODB_URI=your_atlas_uri
AUTH_JWT_SECRET=your_long_random_secret
CLIENT_ORIGIN=https://your-frontend.vercel.app
```

Add Novu variables too if you use notifications (see [05-environment-variables-reference.md](./05-environment-variables-reference.md)).

## Start backend with PM2

```bash
cd ~/YOUR_REPO
pm2 start "node server/index.js" --name task-manager-api --update-env
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

When your app reads env from `dotenv`, run through a small launcher command:

```bash
pm2 delete task-manager-api
pm2 start "node -r dotenv/config server/index.js dotenv_config_path=server/.env.production" --name task-manager-api
pm2 save
```

## Configure Nginx reverse proxy

Create site config:

```bash
sudo nano /etc/nginx/sites-available/task-manager
```

Use:

```nginx
server {
    listen 80;
    server_name your-api-domain.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/task-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

If you are using a domain, point DNS `A` record to the EC2 IP first.

## Enable HTTPS (free SSL)

```bash
sudo certbot --nginx -d your-api-domain.com
```

Certbot also sets auto-renewal. Verify:

```bash
sudo certbot renew --dry-run
```

## Verify deployment

1. Check process:

```bash
pm2 status
pm2 logs task-manager-api --lines 80
```

2. Check health endpoint:

```bash
curl https://your-api-domain.com/api/health
```

Should return JSON with `status: ok`.

## API base for the frontend

Your frontend expects `VITE_API_URL` with `/api` suffix, so set on Vercel:

```text
VITE_API_URL=https://your-api-domain.com/api
```

## Update flow after each push

```bash
cd ~/YOUR_REPO
git fetch origin
git checkout YOUR_DEPLOY_BRANCH
git pull origin YOUR_DEPLOY_BRANCH
npm install
pm2 restart task-manager-api --update-env
```

## Free tier notes

- AWS free tier has **monthly limits** (instance hours, bandwidth, storage). Monitor in AWS Billing.
- Unlike Render free, EC2 does **not** auto-sleep, so your API stays responsive while within limits.
- Keep one small instance and clean unused EBS/Elastic IP resources to avoid charges.

## Checklist

- [ ] EC2 free-tier instance running and reachable
- [ ] PM2 process up after reboot (`pm2 save` + `pm2 startup`)
- [ ] Nginx reverse proxy active
- [ ] SSL certificate installed
- [ ] `MONGODB_URI`, `AUTH_JWT_SECRET`, `CLIENT_ORIGIN` set in production env file
- [ ] `/api/health` works from public URL
