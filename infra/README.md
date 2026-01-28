
# OpenTofu Infrastructure

This directory contains OpenTofu configuration to deploy the backend to AWS EC2 and configure Route53 DNS.

## Prerequisites
- AWS CLI configured with profile `chkmate`.
- OpenTofu installed (`brew install opentofu`).

## Deployment
1. Initialize:
   ```bash
   tofu init
   ```
2. Plan:
   ```bash
   tofu plan
   ```
3. Apply:
   ```bash
   tofu apply
   ```

## Post-Deployment
The deployment will output:
- `public_ip`: The IP of the backend server.
- `api_endpoint`: The HTTP URL.
- `ssh_command`: Command to SSH into the server.

A private key `chkmate-backend-key.pem` will be generated in this directory for SSH access.

## Next Steps
After infrastructure is created:
1. SSH into the server using the generated key.
2. Clone your repository or copy the `server/` files to `/app`.
3. Create a `.env` file in `/app` with your production secrets (DB URL, API Keys).
4. Run `npm install` and `npx prisma generate`.
5. Start the app with PM2: `pm2 start index.ts --interpreter ./node_modules/.bin/ts-node` (or build first).
