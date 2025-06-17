import path from "path";
import fs from "fs";
import util from "util";
import { exec } from "child_process";
import { sanitizeName } from "./cleaning";
import { TRANSCRIPT_DIR } from "@/config";
import logger from "@/lib/logger";

const execPromise = util.promisify(exec);

const splitAudio = async (
  filePath: string,
  segmentDuration = 600
): Promise<string[]> => {
  const cleanName = sanitizeName(filePath);
  const segmentDir = path.join(TRANSCRIPT_DIR, `segments_${cleanName}`);
  if (!fs.existsSync(segmentDir)) {
    fs.mkdirSync(segmentDir, { recursive: true });
  }

  const segmentCmd = `ffmpeg -i "${filePath}" -f segment -segment_time ${segmentDuration} -c copy "${segmentDir}/segment_%03d${path.extname(
    filePath
  )}"`;
  await execPromise(segmentCmd);
  logger.info(`Split audio ${filePath} into segments`);

  return fs.readdirSync(segmentDir).map((f) => path.join(segmentDir, f));
};

export default splitAudio;
