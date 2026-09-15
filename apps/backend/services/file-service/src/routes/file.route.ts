import express from "express";
import {
    createRootFolder,
    createFolder,
    createFile,
    updateFile,
    deleteFile,
    getFile,
    getTree,
} from "../controllers/file.controller";

const router: express.Router = express.Router();

router.post("/create-root-folder", createRootFolder);
router.post("/create-folder", createFolder);
router.post("/create-file", createFile);
router.post("/update/:id(*)", updateFile);
router.delete("/:id(*)", deleteFile);
router.get("/tree/:id", getTree);
router.get("/:id(*)", getFile);

export default router;
