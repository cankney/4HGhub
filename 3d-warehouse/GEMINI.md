# 3D Warehouse - Deployment & Git Workflow

## 1. Git Repository
- **Remote Repo**: `https://github.com/cankney/4HGhub.git` (branch: `main`)
- **Project Location**: This project resides inside the `3d-warehouse/` subdirectory of the `4HGhub` repository.
- **Git Push Procedure**:
  - To push git changes, sync modified/added files into `3d-warehouse/` in `4HGhub` (excluding `.next`, `node_modules`, `tsconfig.tsbuildinfo`, `.vercel`).
  - Commit using author `coletrain04 <rcankney@gmail.com>` and push to `origin main`.

## 2. Live Production Deployment
- **Architecture**: `https://4hghub.com/3d-warehouse` rewrites to `https://3d-warehouse-five.vercel.app/3d-warehouse`.
- **Vercel Project**: The Next.js 3D Warehouse application is linked to Vercel project `3d-warehouse` (`prj_NQRmhDYrXKbhaMv6HPQZ2l00lhN5`, team `cole-ankney-s-projects`).
- **Deploying to Live**:
  - Pushing to `4HGhub` updates the hub wrapper, but **does NOT** deploy the 3D warehouse Next.js app.
  - To deploy changes to the live site, execute:
    ```bash
    vercel --prod --yes
    ```
    from this project directory (`/Users/coleankney-4hgs/Documents/Development/3D Warehouse`).
  - This immediately builds, aliases to `https://3d-warehouse-five.vercel.app`, and makes changes live at `https://4hghub.com/3d-warehouse`.
