const { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { MongoDBAtlasVectorSearch } = require("@langchain/mongodb");
const { MongoClient } = require("mongodb");
const { PromptTemplate } = require("@langchain/core/prompts");
const { RunnableSequence } = require("@langchain/core/runnables");
const { StringOutputParser } = require("@langchain/core/output_parsers");

const client = new MongoClient(process.env.MONGODB_URI);

const promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful customer support assistant. Use ONLY the context below to answer.
If the answer isn't in the context, say "I don't have that information — please contact support."

Context:
{context}

Question: {question}

Answer:
`);

async function askQuestion(question) {
  await client.connect();
  const collection = client.db("chatbotDB").collection("vector_chunks");

  const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-embedding-001",
});

  const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
    collection,
    indexName: "vector_index",
    textKey: "text",
    embeddingKey: "embedding",
  });

  const retriever = vectorStore.asRetriever({ k: 4 });
  const relevantDocs = await retriever.invoke(question);
  const context = relevantDocs.map((d) => d.pageContent).join("\n\n");

  const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-2.5-flash",
  temperature: 0.2,
});

  const chain = RunnableSequence.from([promptTemplate, model, new StringOutputParser()]);

  const answer = await chain.invoke({ context, question });

  return {
    answer,
    sources: relevantDocs.map((d) => d.metadata),
  };
}

module.exports = { askQuestion };