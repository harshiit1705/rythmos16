require("dotenv").config();

const http = require("http");
const { connectDB } = require("./config/db");
const app = require("./app");
const { startCronJobs } = require("./jobs/cronJobs");

async function main() {
  await connectDB();

  const port = process.env.PORT || 5000;
  const server = http.createServer(app);
  server.listen(port, () => {
    console.log(`rythmOS-backend listening on port ${port}`);
  });

  startCronJobs();

  const shutdown = () => {
    console.log("Shutting down...");
    server.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

