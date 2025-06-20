import { Router } from "express";
import sermonRouter from "@/routes/sermon.route";

const router = Router();

router.use("/sermons", sermonRouter);

export default router;
