import { SermonModel } from "@/models";
import { TSermonQueryParams } from "@/types";
import { ResponseFormatter } from "@/utils";
import { Request, Response } from "express";

class SermonController {
  // Add methods for handling sermon-related requests
  async getSermons(req: Request, res: Response) {
    // fetch and return sermons
    const result = await SermonModel.find(req.query as TSermonQueryParams);
    return ResponseFormatter.sendPaginated(res, result.data, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  }

  async getSermonById(req: Request, res: Response) {
    const { id } = req.params;
    // fetch a sermon by ID
    const result = await SermonModel.findById(id);
    return ResponseFormatter.sendSuccess(res, result);
  }

  async createSermon(req: Request, res: Response) {
    const sermonData = req.body;
    // Logic to create a new sermon
    res.status(201).send("Sermon created");
  }

  async updateSermon(req: Request, res: Response) {
    const { id } = req.params;
    const sermonData = req.body;
    // Logic to update a sermon by ID
    res.send(`Sermon with ID: ${id} updated`);
  }

  async deleteSermon(req: Request, res: Response) {
    const { id } = req.params;
    // Logic to delete a sermon by ID
    res.send(`Sermon with ID: ${id} deleted`);
  }
}

export default new SermonController();
