import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  RECOMMENDATION_SYSTEM_PROMPT,
  buildUserPrompt,
  type Recommendation,
} from "~/prompts/recommendations";

interface RequestItem {
  title: string;
  mediaType: string;
}

export class RecommendationService {
  private static getClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    return new GoogleGenerativeAI(apiKey);
  }

  static async getRecommendations(requests: RequestItem[]): Promise<Recommendation[]> {
    const client = this.getClient();
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

    const grouped: Record<string, string[]> = {};
    for (const req of requests) {
      if (!grouped[req.mediaType]) {
        grouped[req.mediaType] = [];
      }
      grouped[req.mediaType].push(req.title);
    }

    let mediaList = "";
    for (const [type, titles] of Object.entries(grouped)) {
      mediaList += `${type}:\n${titles.map((t) => `  - ${t}`).join("\n")}\n\n`;
    }

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: buildUserPrompt(mediaList, requests.length > 0) }],
        },
      ],
      systemInstruction: RECOMMENDATION_SYSTEM_PROMPT,
    });

    const text = result.response.text().trim();

    // Strip code fences if the model wraps them anyway
    const cleaned = text.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");

    return JSON.parse(cleaned) as Recommendation[];
  }
}
