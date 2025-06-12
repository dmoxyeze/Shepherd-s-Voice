import fs from "fs";
import path from "path";
import { generateSermonInsight } from "./services";

const sermon = fs.readFileSync(
  path.join(
    __dirname,
    "transcripts",
    "Faith_Construction_Service_Streamed_3_months_ago.txt"
  ),
  "utf-8"
);

generateSermonInsight(sermon).then(console.log).catch(console.error);
