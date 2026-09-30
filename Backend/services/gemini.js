const { GoogleGenerativeAI } = require("@google/generative-ai");
const env = require("../config/env");

let model = null;

function getModel() {
  if (!env.geminiApiKey) return null;
  if (!model) {
    const client = new GoogleGenerativeAI(env.geminiApiKey);
    model = client.getGenerativeModel({ model: env.geminiModel });
  }
  return model;
}

async function askTutor({ question, course, semester }) {
  const tutor = getModel();
  if (!tutor) {
    return "Gemini is not configured yet. Add GEMINI_API_KEY to the backend .env file to enable the AI tutor.";
  }

  const prompt = [
    "You are the academic AI tutor for SCIM College, Patna.",
    "Give accurate, student-friendly explanations.",
    "Do not fabricate institutional rules, marks, schedules or official notices.",
    `Student course: ${course || "not specified"}`,
    `Semester: ${semester || "not specified"}`,
    `Question: ${question}`,
    "Use clear steps, examples and concise academic language."
  ].join("\n");

  const result = await tutor.generateContent(prompt);
  return result.response.text();
}

module.exports = { askTutor };
