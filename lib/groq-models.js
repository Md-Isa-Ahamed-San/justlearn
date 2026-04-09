/**
 * lib/groq-models.js
 *
 * Shared utility: fetches active Groq text-LLM models dynamically.
 * Uses Next.js native Data Cache so the HTTP call only fires once per hour.
 */

/**
 * Well-known fallback models in priority order.
 * Used ONLY when the dynamic API call fails completely.
 */
const STATIC_FALLBACK_MODEL_IDS = [
  "llama-3.3-70b-versatile",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "llama-3.1-8b-instant",
];

/**
 * Fetch and cache the list of active text-LLM model IDs from Groq.
 * Result is cached by Next.js for 1 hour.
 *
 * @param {string} apiKey - Any valid Groq API key
 * @returns {Promise<string[]>} Shuffled array of active model IDs
 */
export async function getActiveGroqModelIds(apiKey) {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 3600 }, // Cache for 1 hour via Next.js Data Cache
    });

    if (!response.ok) {
      console.warn(`[groq-models] API returned ${response.status} — using static fallback list`);
      return [...STATIC_FALLBACK_MODEL_IDS];
    }

    const { data } = await response.json();

    // Keep only active text-generation models; exclude audio, vision, guard
    const textModels = (data || [])
      .filter((m) => m.active === true)
      .filter(
        (m) =>
          !m.id.includes("whisper") &&
          !m.id.includes("guard") &&
          !m.id.includes("vision") &&
          (m.id.includes("llama") ||
            m.id.includes("gemma") ||
            m.id.includes("mixtral") ||
            m.id.includes("deepseek") ||
            m.id.includes("qwen"))
      )
      .map((m) => m.id);

    if (textModels.length === 0) {
      console.warn("[groq-models] No text models returned — using static fallback list");
      return [...STATIC_FALLBACK_MODEL_IDS];
    }

    // Shuffle for load balancing across models
    const shuffled = textModels.sort(() => Math.random() - 0.5);
    console.log(`[groq-models] Loaded ${shuffled.length} active models from Groq API`);
    return shuffled;
  } catch (error) {
    console.error("[groq-models] Failed to fetch models:", error.message);
    return [...STATIC_FALLBACK_MODEL_IDS];
  }
}

/**
 * Build a prioritised model config list for quiz generation / AI evaluation.
 * Preferred large models are tried first; smaller fast models serve as fallbacks.
 *
 * @param {string[]} modelIds - IDs returned by getActiveGroqModelIds()
 * @returns {Array<{id: string, name: string, maxTokens: number, contextWindow: number, maxQuestionsPerCall: number}>}
 */
export function buildModelConfigs(modelIds) {
  // Preference tiers — score each model so large/versatile ones sort first
  const score = (id) => {
    if (id.includes("70b") && id.includes("versatile")) return 100;
    if (id.includes("maverick")) return 90;
    if (id.includes("70b") || id.includes("65b")) return 80;
    if (id.includes("scout")) return 75;
    if (id.includes("llama-4")) return 70;
    if (id.includes("13b") || id.includes("8b-instant") || id.includes("7b")) return 50;
    if (id.includes("gemma") || id.includes("mixtral")) return 40;
    return 30;
  };

  const sorted = [...modelIds].sort((a, b) => score(b) - score(a));

  return sorted.map((id) => {
    // Assign sensible token limits based on the model ID
    let maxTokens = 8192;
    let contextWindow = 32768;
    let maxQuestionsPerCall = 40;

    if (id.includes("70b") && id.includes("versatile")) {
      maxTokens = 32768;
      contextWindow = 128000;
      maxQuestionsPerCall = 80;
    } else if (id.includes("maverick") || id.includes("scout")) {
      maxTokens = 8192;
      contextWindow = 131072;
      maxQuestionsPerCall = 40;
    } else if (id.includes("70b") || id.includes("65b")) {
      maxTokens = 8192;
      contextWindow = 8192;
      maxQuestionsPerCall = 40;
    }

    return {
      id,
      name: id, // Use the raw ID as the display name
      maxTokens,
      contextWindow,
      maxQuestionsPerCall,
    };
  });
}

/**
 * Collect all Groq API keys from env vars (GROQ_API_KEY_1 … GROQ_API_KEY_4).
 * Returns only keys that are actually set.
 *
 * @returns {string[]}
 */
export function getGroqApiKeys() {
  return [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
  ].filter(Boolean);
}
