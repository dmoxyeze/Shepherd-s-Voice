import { sermonController } from "@/controllers";
import db from "@/lib/db";
import { catchAsync } from "@/utils";
import { Router } from "express";

const sermonRouter = Router();

sermonRouter.get("/", catchAsync(sermonController.getSermons));
sermonRouter.get("/:id", catchAsync(sermonController.getSermonById));

export default sermonRouter;
