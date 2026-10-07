import dotenv from "dotenv";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`CareLink API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start CareLink server");
    process.exit(1);
  }
}

startServer();