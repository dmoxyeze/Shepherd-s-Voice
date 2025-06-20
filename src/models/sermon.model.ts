import db from "@/lib/db";
import logger from "@/lib/logger";
import { TPaginatedSermons, TSermon, TSermonQueryParams } from "@/types";

class SermonModel {
  private static tableName = "sermons";

  /**
   * Find sermons with pagination, filtering, and caching
   */
  static async find(query: TSermonQueryParams): Promise<TPaginatedSermons> {
    const {
      page = 1,
      limit = 20,
      sortBy = "date_preached",
      sortOrder = "desc",
      preacher,
      fromDate,
      toDate,
      search,
    } = query;

    try {
      // Create base query builder
      const queryBuilder = db<TSermon>(this.tableName).select("*");

      // Apply search filter first (most complex condition)
      if (search?.trim()) {
        const searchTerm = `%${search.toLowerCase()}%`;
        queryBuilder.where(function () {
          this.where(db.raw("LOWER(topic) LIKE ?", [searchTerm])).orWhere(
            db.raw(
              "EXISTS (SELECT 1 FROM unnest(themes) AS theme WHERE LOWER(theme) LIKE ?)",
              [searchTerm]
            )
          );
        });
      }

      // Apply other filters
      if (preacher) queryBuilder.where("preacher", "ilike", `%${preacher}%`);
      if (fromDate) queryBuilder.where("date_preached", ">=", fromDate);
      if (toDate) queryBuilder.where("date_preached", "<=", toDate);

      // Clone for count query before adding pagination/sorting
      const countQuery = queryBuilder
        .clone()
        .clearSelect()
        .count("* as total")
        .first();

      // Add sorting and pagination to main query
      queryBuilder
        .orderBy(sortBy, sortOrder)
        .limit(limit)
        .offset((page - 1) * limit);

      // Execute both queries in parallel
      const [data, totalResult] = await Promise.all([queryBuilder, countQuery]);

      const total = Number((totalResult as any)?.total) || 0;
      const totalPages = Math.ceil(total / limit);
      console.log(totalResult, " this is total result");
      return {
        data,
        total,
        page: Number(page),
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error("SermonModel.find failed:", error);
      throw new Error("Failed to fetch sermons");
    }
  }

  /**
   * Find a sermon by ID
   */
  static async findById(id: string): Promise<TSermon | null> {
    try {
      const sermon = await db<TSermon>(this.tableName).where({ id }).first();

      return sermon || null;
    } catch (error) {
      logger.error(`SermonModel.findById(${id}) failed:`, error);
      throw new Error("Failed to fetch sermon");
    }
  }
}

export default SermonModel;
