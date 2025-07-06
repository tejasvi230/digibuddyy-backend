// backend code goes here
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const Tesseract = require("tesseract.js-node");
const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect("mongodb://localhost:27017/digibuddy", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error", err));

const activitySchema = new mongoose.Schema({
  text: String,
  timestamp: { type: Date, default: Date.now },
  imagePath: String,
});
const Activity = mongoose.model("Activity", activitySchema);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

app.post("/upload", upload.single("screenshot"), async (req, res) => {
  const imagePath = req.file.path;
  try {
    const result = await Tesseract.recognize(imagePath, "eng");
    const extractedText = result.data.text;

    const activity = new Activity({
      text: extractedText,
      imagePath,
    });
    await activity.save();

    res.json({ message: "Screenshot processed", text: extractedText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "OCR Error" });
  }
});

app.get("/data", async (req, res) => {
  const data = await Activity.find().sort({ timestamp: -1 });
  res.json(data);
});

const port = 5000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
