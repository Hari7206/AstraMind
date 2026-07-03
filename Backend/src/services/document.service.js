import { HfInference } from "@huggingface/inference";
import mammoth from "mammoth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const documentStore = new Map();

export async function extractTextFromFile(filePath, fileType) {
  try {
    const fileBuffer = fs.readFileSync(filePath);

    if (fileType === "pdf") {
      const data = await pdfParse(fileBuffer);
      return data.text;
    }

    if (fileType === "docx") {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    }

    if (fileType === "txt") {
      return fileBuffer.toString("utf-8");
    }

    throw new Error("Unsupported file type");
  } catch (error) {
    console.error("Error extracting text:", error.message);
    throw error;
  }
}

export function splitTextIntoChunks(text, chunkSize = 200, overlap = 30) {
  const chunks = [];
  const words = text.split(/\s+/);
  let i = 0;

  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    chunks.push(chunk);
    i += chunkSize - overlap;
  }

  return chunks;
}

async function getEmbedding(text) {
  try {
    const result = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: text,
    });
    return result;
  } catch (error) {
    console.error("Error getting embedding:", error.message);
    throw error;
  }
}

export async function createDocumentEmbeddings(documentId, chunks) {
  try {
    const embeddingsArray = [];
    
    for (const text of chunks) {
      const embedding = await getEmbedding(text);
      embeddingsArray.push({ text, embedding });
    }

    documentStore.set(documentId, {
      chunks: embeddingsArray,
      timestamp: Date.now()
    });

    return true;
  } catch (error) {
    console.error("Error creating embeddings:", error.message);
    throw error;
  }
}

function cosineSimilarity(vecA, vecB) {
  const minLength = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < minLength; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

export async function searchDocument(documentId, query, k = 5) {
  try {
    const docData = documentStore.get(documentId);
    if (!docData) {
      throw new Error("Document embeddings not found");
    }

    const queryEmbedding = await getEmbedding(query);

    const scoredChunks = docData.chunks.map((chunk) => ({
      text: chunk.text,
      score: cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    const topResults = scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, k);

    return topResults;
  } catch (error) {
    console.error("Error searching document:", error.message);
    throw error;
  }
}

export function removeDocumentEmbeddings(documentId) {
  documentStore.delete(documentId);
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of documentStore.entries()) {
    if (now - value.timestamp > 3600000) {
      documentStore.delete(key);
    }
  }
  console.log(`🧹 Cleaned up old embeddings. Active: ${documentStore.size}`);
}, 600000);