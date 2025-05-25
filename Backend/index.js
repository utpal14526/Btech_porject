require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const pdf = require("pdf-parse");
const { execSync } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const technologyKeywords = [
  "javascript",
  "python",
  "java",
  "c++",
  "c#",
  "go",
  "ruby",
  "node.js",
  "react",
  "angular",
  "vue.js",
  "express",
  "next.js",
  "mongodb",
  "mysql",
  "postgresql",
  "firebase",
  "docker",
  "kubernetes",
  "aws",
  "azure",
  "gcp",
  "git",
  "linux",
  "html",
  "css",
  "typescript",
  "graphql",
  "rest",
  "jenkins",
  "terraform",
  "spring",
  "laravel",
];

app.use(
  cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

async function extractTextFromPdf(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    const text = data.text;

    // Ensure 'text' directory exists
    const outputDir = path.join(__dirname, "text");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Generate a unique filename
    const fileName = `resume-${Date.now()}.txt`;
    const outputPath = path.join(outputDir, fileName);

    // Write extracted text to file
    fs.writeFileSync(outputPath, text);
    console.log(`Text extracted and saved to ${outputPath}`);

    return outputPath;
  } catch (err) {
    console.error("Error extracting text from PDF:", err);
  }
}

function findTechnologiesInText(text) {
  const lowerText = text.toLowerCase();
  const found = technologyKeywords.filter((tech) =>
    lowerText.includes(tech.toLowerCase())
  );
  return [...new Set(found)]; // remove duplicates
}

function getQuestionsForTechnology(tech) {
  try {
   
    const output = execSync(`python3 question_model.py "${tech}"`);
    console.log(output);
    return output.toString().trim().split("\n");
  } catch (err) {
    console.error(`Error generating questions for ${tech}:`, err.message);
    return [];
  }
}

// Endpoint to receive resume, parse PDF and extract technologies
app.post("/upload", upload.single("resume"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = path.join(__dirname, "uploads", req.file.filename);
  const outputPath = await extractTextFromPdf(filePath);

  if (!outputPath) {
    return res.status(500).json({ error: "Failed to extract text" });
  }

  // Read the written text file and find technologies
  const content = fs.readFileSync(outputPath, "utf-8");
  const technologiesFound = findTechnologiesInText(content);
  console.log(technologiesFound);

  const techQuestions = {};
  technologiesFound.forEach((tech) => {
    techQuestions[tech] = getQuestionsForTechnology(tech);
  });

  return res.status(200).json({
    message: "Upload and parsing successful",
    technologies: technologiesFound,
    questions: techQuestions,
  });
});

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
});
