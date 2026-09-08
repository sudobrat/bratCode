import type { File } from "@bratCode/zod";

export interface FileTreeNode extends File {
    children: FileTreeNode[];
}

export const buildTree = (files: File[]): FileTreeNode[] => {
    const map: Record<string, FileTreeNode> = {};
    const tree: FileTreeNode[] = [];

    files.forEach((file) => {
        const fileObj =
            "toObject" in file && typeof (file as any).toObject === "function"
                ? (file as any).toObject()
                : file;

        map[file._id.toString()] = {
            ...fileObj,
            children: [],
        };
    });

    files.forEach((file) => {
        const id = file._id.toString();
        const node = map[id];
        if (!node) return;

        if (file.parentId) {
            const parent = map[file.parentId.toString()];
            if (parent) {
                parent.children.push(node);
            } else {
                tree.push(node);
            }
        } else {
            tree.push(node);
        }
    });

    return tree;
};

