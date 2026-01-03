import { GoogleGenerativeAI } from "@google/generative-ai";
import { ITicket } from "../types/type";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface AIAnalysisResult {
  aiSentiment: "positive" | "neutral" | "negative";
  aiSuggestedPriority: "low" | "medium" | "high" | "urgent";
  aiSuggestedCategory: "technical" | "billing" | "general" | "feature_request" | "bug_report";
  aiSummary: string;
}

export const analyzeTicket = async (
  ticket: Pick<ITicket, "title" | "description">
): Promise<AIAnalysisResult> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this customer support ticket and provide a JSON response.

Ticket Title: ${ticket.title}
Ticket Description: ${ticket.description}

Respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "sentiment": "positive" | "neutral" | "negative",
  "priority": "low" | "medium" | "high" | "urgent",
  "category": "technical" | "billing" | "general" | "feature_request" | "bug_report",
  "summary": "A brief 1-2 sentence summary of the ticket"
}

Guidelines:
- sentiment: Based on customer tone and urgency
- priority: urgent (system down/critical), high (major issue), medium (standard), low (minor/question)
- category: technical (bugs/errors), billing (payments/invoices), feature_request, bug_report, general (other)
- summary: Concise summary for quick agent review`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Clean response - remove markdown code blocks if present
    const cleanedResponse = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const analysis = JSON.parse(cleanedResponse);

    return {
      aiSentiment: analysis.sentiment,
      aiSuggestedPriority: analysis.priority,
      aiSuggestedCategory: analysis.category,
      aiSummary: analysis.summary,
    };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    // Return defaults on failure
    return {
      aiSentiment: "neutral",
      aiSuggestedPriority: "medium",
      aiSuggestedCategory: "general",
      aiSummary: "Unable to generate AI summary",
    };
  }
};

export const generateResponseSuggestion = async (
  ticketTitle: string,
  ticketDescription: string,
  conversationHistory: string
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a helpful customer support agent. Generate a professional response suggestion.

Ticket: ${ticketTitle}
Issue: ${ticketDescription}
${conversationHistory ? `Previous messages:\n${conversationHistory}` : ""}

Provide a helpful, empathetic response that addresses the customer's concern. Keep it concise and professional.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("AI Response Generation Error:", error);
    return "";
  }
};
