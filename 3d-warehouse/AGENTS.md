<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 3D Warehouse Deployment & Git Workflow

### Git Repository
- **Remote Repo**: `https://github.com/cankney/4HGhub.git` (branch: `main`)
- **Project Location**: This project resides inside the `3d-warehouse/` subdirectory of `4HGhub`.
- **Git Push Procedure**:
  - Sync modified/added files into `3d-warehouse/` in `4HGhub` (excluding `.next`, `node_modules`, `tsconfig.tsbuildinfo`, `.vercel`).
  - Commit using author `coletrain04 <rcankney@gmail.com>` and push to `origin main`.

### Live Production Deployment
- **Architecture**: `https://4hghub.com/3d-warehouse` rewrites to `https://3d-warehouse-five.vercel.app/3d-warehouse`.
- **Vercel Project**: The Next.js 3D Warehouse application is linked to Vercel project `3d-warehouse` (`prj_NQRmhDYrXKbhaMv6HPQZ2l00lhN5`).
- **Deploying Live**:
  - Pushing to `4HGhub` updates the hub wrapper, but **does NOT** deploy the 3D warehouse Next.js app.
  - To deploy changes to the live site, execute:
    ```bash
    vercel --prod --yes
    ```
    directly from this project directory (`/Users/coleankney-4hgs/Documents/Development/3D Warehouse`).
  - This immediately builds, aliases to `https://3d-warehouse-five.vercel.app`, and makes changes live at `https://4hghub.com/3d-warehouse`.

