import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEntityDescription(entityName: string, parentName?: string) {
  if (!entityName) {
    return "A company with ownership information available.";
  }

  const prompt = `
  Write a concise, friendly description (max 2 sentences) for the brand "${entityName}".
  If parent company "${parentName}" is provided, mention its relationship in a natural way.
  Avoid marketing fluff. Keep it factual and neutral.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
    });

    return completion.choices[0].message.content?.trim() || `${entityName} is a company with ownership information available.`;
  } catch (error) {
    console.error("LLM generation failed for", entityName, error);
    return `${entityName} is a company with ownership information available.`;
  }
} 