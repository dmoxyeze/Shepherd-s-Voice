import { PORT } from "@/config";
import app from "@/app";

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
