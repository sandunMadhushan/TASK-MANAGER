# 2 — MongoDB Atlas (free cluster)

## Goal

Get a **production** `MONGODB_URI` you will paste into your backend production env (AWS EC2 in this guide), **not** into your local `.env` unless you want to.

## Steps

### 1. Create a project and cluster

1. Sign in at [MongoDB Atlas](https://cloud.mongodb.com).
2. Create a **project** (any name).
3. **Build a database** → choose **M0** (free) → pick a **region** close to your API host (same AWS region if possible).
4. Create the cluster (may take a few minutes).

### 2. Database access (user + password)

1. Left sidebar → **Database Access** → **Add New Database User**.
2. Choose **Password** authentication; save the password securely (password manager).
3. User privileges: **Read and write to any database** is fine for this app on a dedicated cluster.

### 3. Network access

1. Left sidebar → **Network Access** → **Add IP Address**.
2. For a first deploy, **Allow access from anywhere** (`0.0.0.0/0`) is common while setup is in progress.
   - Tightening to specific IPs is possible but harder on free PaaS.  
   - Always use a **strong** database user password.

### 4. Connection string

1. **Database** → **Connect** → **Drivers**.
2. Copy the **connection string** (SRV form), e.g. `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/...`
3. Replace `<password>` with your user’s password (URL-encode special characters if needed).
4. Add a database name if missing, e.g. `...mongodb.net/nexus-tasks?retryWrites=true&w=majority`.

## Where this value goes

- **Only** in your **backend host’s** environment variables as `MONGODB_URI` (see [03-backend-render.md](./03-backend-render.md) and [05-environment-variables-reference.md](./05-environment-variables-reference.md)).

Do **not** commit this string to git.

## Checklist

- [ ] M0 cluster running  
- [ ] Database user created  
- [ ] Network access allows your API host to connect  
- [ ] Full `MONGODB_URI` copied for backend production env
