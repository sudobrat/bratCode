# Kubernetes Architecture Context

When you are ready to begin the deployment phase, you can paste the following context points back to me (or any AI session) to instantly restore the context of what we have built:

---

**Project Context: Cloud IDE Deployment on AKS**

We are building a distributed Cloud IDE with a microservice architecture. We have transitioned away from standard local execution to a Kubernetes-native model for workspaces. 

**Key Architectural Decisions & State:**
1. **Dynamic Workspace Pods:** We do NOT use host-based shells. The `terminal-service` dynamically spawns a dedicated Kubernetes Pod (`node:20-bullseye`) for each project using `@kubernetes/client-node`.
2. **Persistent State (`ide-pvc`):** All projects share a single Kubernetes Persistent Volume Claim (`ide-pvc`). When a project pod spawns, it mounts the PVC to `/workspace/<projectName>` using the `subPath` feature (isolated by `projectId`).
3. **WebSockets & K8s Exec:** The `terminal-service` connects to the frontend via Socket.IO, and uses the Kubernetes `Exec` API to pipe raw binary streams (stdin/stdout) directly into the running pod's bash shell.
4. **Pod-Delegated File System:** The `file-service` no longer uses MongoDB for file contents or directory structures. Instead, it uses the Kubernetes `Exec` API to run raw bash and Node commands (`cat`, `mkdir`, `rm`, `node -e`) directly inside the project's pod to read/write files to the PVC. The absolute file path + `projectId` acts as the unique identifier (`_id`).
5. **Dynamic Port Proxy:** The `terminal-service` acts as an HTTP reverse proxy using `http-proxy-middleware`. If a user starts a dev server in the terminal (e.g. port 5173), the proxy automatically routes requests from `http://<domain>/preview/<projectId>/5173/` to the internal Kubernetes Service (`ide-svc-<projectId>.default.svc.cluster.local:5173`).
6. **Next Phase:** We need to write Dockerfiles for all microservices, Kubernetes manifests (`Deployments`, `Ingress`, etc.), and set up Terraform + GitHub Actions to provision the AKS cluster on demand.
