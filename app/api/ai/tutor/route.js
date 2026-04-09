export const dynamic = 'force-dynamic';
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { buildModelConfigs, getActiveGroqModelIds, getGroqApiKeys } from "@/lib/groq-models";

const SYSTEM_PROMPT = `You are a helpful and Socratic AI Tutor for a university-level Learning Management System.
Your goal is to help students understand concepts deeper, NOT to give them direct answers to quizzes or assignments.

GUIDELINES:
1. If asked for a direct answer (e.g., "What is the answer to Q5?"), refuse politely and explain the concept instead.
2. Use analogies and simple language to explain complex topics.
3. Be encouraging and patient.
4. Keep responses concise (under 150 words) unless asked for a detailed explanation.
5. Use markdown for formatting (bold, italics, lists).

CONTEXT AWARENESS:
You will be provided with the "Current Lesson Context". Use this to tailor your explanations to what the student is currently learning.`;

export async function POST(request) {
    try {
        const { message, history, lessonContext } = await request.json();

        if (!message) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        // ✅ Fetch the best available model dynamically (cached 1 hour)
        const keys = getGroqApiKeys();
        const activeModelIds = await getActiveGroqModelIds(keys[0]);
        const models = buildModelConfigs(activeModelIds);

        if (!models.length) {
            return NextResponse.json(
                { error: "No available AI models at this time. Please try again later." },
                { status: 503 }
            );
        }

        // Rotate through API keys for load balancing
        const groq = new Groq({
            apiKey: keys[Math.floor(Math.random() * keys.length)],
        });

        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...(history || []).slice(-4), // Keep last 4 turns for context
            {
                role: "user",
                content: `Context: ${lessonContext || "General Inquiry"}\n\nStudent Question: ${message}`,
            },
        ];

        let response;
        // Try each model in priority order until one succeeds
        for (const m of models) {
            try {
                const completion = await groq.chat.completions.create({
                    messages,
                    model: m.id,
                    temperature: 0.5,
                    max_tokens: 500,
                });

                response =
                    completion.choices[0]?.message?.content ||
                    "I'm sorry, I couldn't generate a response. Please try again.";
                console.log(`[AI Tutor] Responded using model: ${m.id}`);
                break; // Success — stop trying fallbacks
            } catch (err) {
                console.warn(`[AI Tutor] Model ${m.id} failed: ${err.message}`);
            }
        }

        if (!response) {
            return NextResponse.json(
                { error: "All available models failed to respond. Please try again." },
                { status: 503 }
            );
        }

        return NextResponse.json({ response });

    } catch (error) {
        console.error("AI Tutor Error:", error);
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}
