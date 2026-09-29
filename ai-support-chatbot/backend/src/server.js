require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const documentRoutes = require("./routes/document.routes");
const chatRoutes = require("./routes/chat.routes");
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT, () => console.log(`Server on port ${process.env.PORT}`));
  })
  .catch((err) => console.error(err));