import * as k8s from "@kubernetes/client-node";
import { log } from "@bratCode/logger";
import { Writable, PassThrough } from "stream";

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sExec = new k8s.Exec(kc);

export const K8S_NAMESPACE = "default";

export async function execCommandInPod(
    podName: string,
    command: string[],
    stdinData?: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise(async (resolve, reject) => {
        let stdout = "";
        let stderr = "";

        const outStream = new Writable({
            write(chunk, encoding, callback) {
                stdout += chunk.toString();
                callback();
            },
        });

        const errStream = new Writable({
            write(chunk, encoding, callback) {
                stderr += chunk.toString();
                callback();
            },
        });

        let inStream = null;
        if (stdinData !== undefined) {
            inStream = new PassThrough();
            inStream.end(stdinData);
        }

        try {
            await k8sExec.exec(
                K8S_NAMESPACE,
                podName,
                "workspace", // container name
                command,
                outStream,
                errStream,
                inStream,
                false /* tty */,
                (status: k8s.V1Status) => {
                    resolve({
                        stdout,
                        stderr,
                        exitCode: status.status === "Success" ? 0 : 1,
                    });
                }
            );
        } catch (err) {
            reject(err);
        }
    });
}

// Function to resolve the project's pod name.
// If the pod doesn't exist, we wait for it. In a real microservice arch, 
// we'd probably trigger the pod creation here if it's missing.
export async function getProjectPod(projectId: string, projectName: string = "project"): Promise<string> {
    const podName = `ide-pod-${projectId}`;
    
    try {
        const pod = await k8sCoreApi.readNamespacedPod({ name: podName, namespace: K8S_NAMESPACE });
        if (pod.status?.phase === "Running") {
            return podName;
        }
    } catch (err: any) {
        if (err.code !== 404) {
            throw err;
        }
    }

    log(`Pod ${podName} not found by file-service. Creating it...`);
    
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
    
    // Wait for the pod to be in "Running" state
    await new Promise<void>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 30; // 30 * 2s = 60s max wait time

        const checkStatus = async () => {
            try {
                const pod = await k8sCoreApi.readNamespacedPod({ name: podName, namespace: K8S_NAMESPACE });
                if (pod.status?.phase === "Running") {
                    resolve();
                } else if (pod.status?.phase === "Failed" || pod.status?.phase === "Unknown") {
                    reject(new Error(`Pod ${podName} failed to start. Status: ${pod.status.phase}`));
                } else {
                    attempts++;
                    if (attempts >= maxAttempts) {
                        reject(new Error(`Timeout waiting for pod ${podName} to become Running.`));
                    } else {
                        setTimeout(checkStatus, 2000);
                    }
                }
            } catch (err) {
                reject(err);
            }
        };
        checkStatus();
    });

    return podName;
}
