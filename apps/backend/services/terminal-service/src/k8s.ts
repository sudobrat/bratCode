import * as k8s from "@kubernetes/client-node";
import { log } from "@bratCode/logger";
import { Writable, PassThrough } from "stream";

const kc = new k8s.KubeConfig();
// This will automatically load the kubeconfig from ~/.kube/config (locally)
// or from the service account if running inside a pod.
kc.loadFromDefault();

const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sExec = new k8s.Exec(kc);

export const K8S_NAMESPACE = "default";

export async function createServiceForProject(projectId: string): Promise<string> {
    const serviceName = `ide-svc-${projectId}`;

    try {
        const existingService = await k8sCoreApi.readNamespacedService({ name: serviceName, namespace: K8S_NAMESPACE });
        if (existingService) {
            log(`Service ${serviceName} already exists`);
            return serviceName;
        }
    } catch (err: any) {
        if (err.code !== 404) {
            throw err;
        }
    }

    log(`Creating service ${serviceName} for project ${projectId}...`);

    const serviceManifest: k8s.V1Service = {
        metadata: {
            name: serviceName,
            labels: {
                app: "ide-pod",
                projectId: projectId,
            },
        },
        spec: {
            selector: {
                app: "ide-pod",
                projectId: projectId,
            },
            ports: [
                {
                    name: "vite",
                    port: 5173,
                    targetPort: 5173 as any,
                },
                {
                    name: "http",
                    port: 3000,
                    targetPort: 3000 as any,
                },
                {
                    name: "http2",
                    port: 8080,
                    targetPort: 8080 as any,
                }
            ],
            type: "ClusterIP",
        },
    };

    await k8sCoreApi.createNamespacedService({ namespace: K8S_NAMESPACE, body: serviceManifest });
    log(`Service ${serviceName} created successfully.`);

    return serviceName;
}

export async function createPodForProject(projectId: string, projectName: string = "project"): Promise<string> {
    const podName = `ide-pod-${projectId}`;

    try {
        // Check if pod already exists
        const existingPod = await k8sCoreApi.readNamespacedPod({ name: podName, namespace: K8S_NAMESPACE });
        if (existingPod) {
            log(`Pod ${podName} already exists`);
            await createServiceForProject(projectId);
            return podName;
        }
    } catch (err: any) {
        if (err.code !== 404) {
            throw err;
        }
        // Pod does not exist, so we proceed to create it
    }

    log(`Creating pod ${podName} for project ${projectId}...`);

    // Define the Pod manifest
    const podManifest: k8s.V1Pod = {
        metadata: {
            name: podName,
            labels: {
                app: "ide-pod",
                projectId: projectId,
            },
        },
        spec: {
            containers: [
                {
                    name: "workspace",
                    // Using a standard node image for development
                    image: "node:20-bullseye",
                    command: ["/bin/bash", "-c", "sleep infinity"], // Keep the pod running indefinitely
                    workingDir: `/workspace/${projectName}`,
                    env: [
                        {
                            name: "HOST",
                            value: "0.0.0.0",
                        },
                    ],
                    volumeMounts: [
                        {
                            name: "workspace-volume",
                            // Mount the subpath for this project specifically!
                            // This ensures projects are separated on the same disk
                            subPath: projectId,
                            mountPath: `/workspace/${projectName}`,
                        },
                    ],
                },
            ],
            volumes: [
                {
                    name: "workspace-volume",
                    persistentVolumeClaim: {
                        claimName: "ide-pvc",
                    },
                },
            ],
            restartPolicy: "Always",
        },
    };

    // Create the Pod
    await k8sCoreApi.createNamespacedPod({ namespace: K8S_NAMESPACE, body: podManifest });
    log(`Pod ${podName} created successfully.`);

    // Wait for the pod to be in "Running" state
    await waitForPodRunning(podName);

    // Create the Service for this pod to enable port forwarding
    await createServiceForProject(projectId);

    return podName;
}

async function waitForPodRunning(podName: string) {
    return new Promise<void>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 30; // 30 * 2s = 60s max wait time

        const checkStatus = async () => {
            try {
                const pod = await k8sCoreApi.readNamespacedPod({ name: podName, namespace: K8S_NAMESPACE });
                if (pod.status?.phase === "Running") {
                    log(`Pod ${podName} is now Running.`);
                    resolve();
                } else if (pod.status?.phase === "Failed" || pod.status?.phase === "Unknown") {
                    reject(new Error(`Pod ${podName} failed to start. Status: ${pod.status.phase}`));
                } else {
                    attempts++;
                    if (attempts >= maxAttempts) {
                        reject(new Error(`Timeout waiting for pod ${podName} to become Running.`));
                    } else {
                        setTimeout(checkStatus, 2000); // Check again in 2 seconds
                    }
                }
            } catch (err) {
                reject(err);
            }
        };

        checkStatus();
    });
}

export async function execTerminal(
    podName: string,
    cols: number,
    rows: number,
    onData: (data: string) => void,
    onExit: (code: number) => void
) {
    let ws: any; // WebSocket instance

    // We create an in-memory stream to capture stdout/stderr from the pod
    const outStream = new Writable({
        write(chunk, encoding, callback) {
            onData(chunk.toString());
            callback();
        },
    });

    const errStream = new Writable({
        write(chunk, encoding, callback) {
            onData(chunk.toString());
            callback();
        },
    });

    const inStream = new PassThrough();

    try {
        ws = await k8sExec.exec(
            K8S_NAMESPACE,
            podName,
            "workspace", // container name
            ["/bin/bash"],
            outStream, // stdout
            errStream, // stderr
            inStream, // stdin
            true /* tty */,
            (status: k8s.V1Status) => {
                log(`Terminal session exited with status: ${status.status}`);
                onExit(status.status === "Success" ? 0 : 1);
            }
        );

        // Resize the terminal to match the user's frontend xterm
        if (ws) {
            // Send the resize command
            const resizeMessage = JSON.stringify({
                Width: cols,
                Height: rows,
            });
            
            // Kubernetes exec protocol uses channel 4 for resize events
            const resizeBuffer = Buffer.alloc(resizeMessage.length + 1);
            resizeBuffer.writeUInt8(4, 0); // Channel 4 is for resize
            resizeBuffer.write(resizeMessage, 1);
            
            ws.send(resizeBuffer);
        }

        return { ws, inStream };
    } catch (err) {
        log(`Error executing terminal in pod ${podName}: ${err}`);
        throw err;
    }
}
