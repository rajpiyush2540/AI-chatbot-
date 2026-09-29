const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { MongoDBAtlasVectorSearch } = require("@langchain/mongodb");
const { MongoClient } = require("mongodb");
const { PDFParse } = require("pdf-parse");
const fs = require("fs");
const mammoth = require("mammoth");

const client = new MongoClient(process.env.MONGODB_URI);

async function extractText(filePath, mimetype) {
  if (mimetype === "application/pdf") {
    const buffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  }
  if (mimetype.includes("word")) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  return fs.readFileSync(filePath, "utf-8"); // .txt
}

async function ingestDocument(filePath, mimetype, docId) {
  const rawText = await extractText(filePath, mimetype);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 150,
  });
  const chunks = await splitter.createDocuments([rawText], [{ docId }]);

  const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-embedding-001",
});

  await client.connect();
  const collection = client.db("chatbotDB").collection("vector_chunks");

  await MongoDBAtlasVectorSearch.fromDocuments(chunks, embeddings, {
    collection,
    indexName: "vector_index",
    textKey: "text",
    embeddingKey: "embedding",
  });

  return chunks.length;
}

module.exports = { ingestDocument };