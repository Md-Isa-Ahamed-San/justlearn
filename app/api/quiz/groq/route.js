export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import {
  buildModelConfigs,
  getActiveGroqModelIds,
  getGroqApiKeys,
} from "@/lib/groq-models";

// ✅ Initialize Groq instances from all available API keys
const groqInstances = getGroqApiKeys().map((key) => new Groq({ apiKey: key }));

// Account health tracking (keyed by index 1–N)
let accountHealth = {};
groqInstances.forEach((_, i) => {
  accountHealth[i + 1] = { successRate: 1.0, avgResponseTime: 0, failures: 0 };
});

// Helper function to extract text from file
async function extractTextFromFile(file) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  let extractedText = "";

  try {
    if (file.type === "application/pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else if (file.type.includes("word") || file.type.includes("document")) {
      const mammoth = (await import("mammoth")).default;
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (file.type === "text/plain") {
      extractedText = buffer.toString("utf8");
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }
  } catch (error) {
    console.error("Error extracting text from file:", error);
    throw new Error(`Failed to extract text from file: ${error.message}`);
  }

  return extractedText;
}

// Smart account selection based on health scores
function selectOptimalAccounts(totalQuestions) {
  const sortedAccounts = Object.entries(accountHealth)
    .map(([id, health]) => ({
      id: parseInt(id),
      score:
        health.successRate -
        health.failures * 0.1 +
        (health.avgResponseTime > 0
          ? (10000 / health.avgResponseTime) * 0.1
          : 0),
    }))
    .sort((a, b) => b.score - a.score);

  let accountsToUse;
  if (totalQuestions <= 8) accountsToUse = 1;
  else if (totalQuestions <= 24) accountsToUse = 2;
  else if (totalQuestions <= 60) accountsToUse = 3;
  else accountsToUse = Math.min(4, groqInstances.length);

  return sortedAccounts.slice(0, accountsToUse).map((a) => a.id);
}

// Exact-count distribution across accounts
function calculateOptimalDistribution(targetMcq, targetShort, targetLong, selectedAccounts) {
  const totalQuestions = targetMcq + targetShort + targetLong;
  const accountCount = selectedAccounts.length;

  if (totalQuestions === 0) {
    return selectedAccounts.map((accountId) => ({ accountId, mcq: 0, short: 0, long: 0 }));
  }

  const mcqAllocation = Array(targetMcq).fill(0).map((_, i) => i % accountCount);
  const shortAllocation = Array(targetShort).fill(0).map((_, i) => i % accountCount);
  const longAllocation = Array(targetLong).fill(0).map((_, i) => i % accountCount);

  const distributions = selectedAccounts.map((accountId, i) => ({
    accountId,
    mcq: mcqAllocation.filter((idx) => idx === i).length,
    short: shortAllocation.filter((idx) => idx === i).length,
    long: longAllocation.filter((idx) => idx === i).length,
  }));

  // Verify correctness
  const totals = {
    mcq: distributions.reduce((s, d) => s + d.mcq, 0),
    short: distributions.reduce((s, d) => s + d.short, 0),
    long: distributions.reduce((s, d) => s + d.long, 0),
  };
  if (totals.mcq !== targetMcq || totals.short !== targetShort || totals.long !== targetLong) {
    throw new Error("Distribution calculation error — totals do not match targets");
  }
  return distributions;
}

// Update account health metrics
function updateAccountHealth(accountId, success, responseTime) {
  const health = accountHealth[accountId];
  if (!health) return;

  if (success) {
    health.successRate = health.successRate * 0.9 + 1.0 * 0.1;
    health.avgResponseTime =
      health.avgResponseTime === 0
        ? responseTime
        : health.avgResponseTime * 0.8 + responseTime * 0.2;
  } else {
    health.successRate = health.successRate * 0.9;
    health.failures += 1;
    if (health.failures > 10) health.failures = 5;
  }
}

// ✅ generateWithFallback now receives the dynamic model list from the caller
async function generateWithFallback(
  groqInstance,
  contextData,
  aiPrompt,
  targetMcq,
  targetShort,
  targetLong,
  accountId,
  dynamicModels   // <-- passed in from POST so we fetch once
) {
  for (let i = 0; i < dynamicModels.length; i++) {
    try {
      return await generateWithGroqInstance(
        groqInstance,
        dynamicModels[i],
        contextData,
        aiPrompt,
        targetMcq,
        targetShort,
        targetLong,
        accountId
      );
    } catch (error) {
      console.error(
        `[Account ${accountId} - ${dynamicModels[i].id}] Failed:`,
        error.message
      );
      if (i === dynamicModels.length - 1) throw error;
      console.log(`[Account ${accountId}] Trying next model: ${dynamicModels[i + 1].id}`);
    }
  }
  throw new Error("All dynamic models exhausted.");
}


// FIXED: Smart redistribution that prevents over-generation
function calculateRedistribution(
  originalTargets,
  currentResults,
  failedDistributions // We might not need failedDistributions if we only use successful ones
) {
  // Calculate what we actually have from successful results
  const currentCounts = {
    mcq: 0,
    short: 0,
    long: 0,
  };

  currentResults.forEach((result) => {
    // Ensure result.questions is an array before iterating
    if (Array.isArray(result.questions)) {
      result.questions.forEach((question) => {
        if (question.type === "mcq") currentCounts.mcq++;
        else if (question.type === "short_answer") currentCounts.short++;
        else if (question.type === "long_answer") currentCounts.long++;
      });
    }
  });

  // Calculate exactly what we still need
  const stillNeeded = {
    mcq: Math.max(0, originalTargets.mcq - currentCounts.mcq),
    short: Math.max(0, originalTargets.short - currentCounts.short),
    long: Math.max(0, originalTargets.long - currentCounts.long),
  };

  const totalStillNeeded =
    stillNeeded.mcq + stillNeeded.short + stillNeeded.long;

  if (totalStillNeeded === 0) {
    return []; // No redistribution needed
  }

  // Find the best performing account from successful results
  // Ensure requestedCounts exists and has the necessary properties
  const bestAccount = currentResults
    .filter(
      (result) =>
        Array.isArray(result.questions) &&
        result.questions.length > 0 &&
        result.requestedCounts
    )
    .sort((a, b) => {
      const efficiencyA =
        a.requestedCounts.mcq +
          a.requestedCounts.short +
          a.requestedCounts.long >
        0
          ? a.questions.length /
            (a.requestedCounts.mcq +
              a.requestedCounts.short +
              a.requestedCounts.long)
          : 0;
      const efficiencyB =
        b.requestedCounts.mcq +
          b.requestedCounts.short +
          b.requestedCounts.long >
        0
          ? b.questions.length /
            (b.requestedCounts.mcq +
              b.requestedCounts.short +
              b.requestedCounts.long)
          : 0;
      return efficiencyB - efficiencyA;
    })[0];

  if (!bestAccount || !bestAccount.account) {
    // If no suitable account found
    console.warn("No suitable account found for redistribution.");
    return [];
  }

  console.log(
    `Redistributing ${totalStillNeeded} questions to account ${bestAccount.account}:`,
    stillNeeded
  );

  return [
    {
      accountId: bestAccount.account,
      mcq: stillNeeded.mcq,
      short: stillNeeded.short,
      long: stillNeeded.long,
    },
  ];
}

// --- FUNCTIONS FROM YOUR INSTRUCTION BLOCK START ---

// Enhanced time tracking utilities
function formatDuration(milliseconds) {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(1);
    return `${minutes}m ${seconds}s`;
  }
}

// Enhanced generateWithGroqInstance function with better time tracking
async function generateWithGroqInstance(
  groqInstance,
  model,
  contextData,
  aiPrompt,
  targetMcq,
  targetShort,
  targetLong,
  accountId
) {
  const startTime = Date.now();
  const totalRequested = targetMcq + targetShort + targetLong;

  if (totalRequested === 0) {
    return {
      account: accountId,
      model: model.name,
      questions: [],
      requestedCounts: { mcq: targetMcq, short: targetShort, long: targetLong },
      timing: {
        startTime: new Date(startTime).toISOString(),
        duration: 0,
        formattedDuration: "0ms",
        questionsPerSecond: 0,
      },
    };
  }

  const systemPrompt = `You are an expert quiz generator. You MUST generate EXACTLY the requested number of questions for each type.

CRITICAL STRICT REQUIREMENTS:
- Generate EXACTLY ${targetMcq + 5} multiple choice questions (no more, no less)
- Generate EXACTLY ${
    targetShort + 3
  } short answer questions (no more, no less)  
- Generate EXACTLY ${targetLong + 3} long answer questions (no more, no less)
- Total questions MUST be exactly ${totalRequested}
- Each MCQ should have 4 options with only one/two correct answer
- Provide explanations for all questions
- Questions should be relevant to the context provided
- Vary difficulty levels appropriately
- This is Account ${accountId} processing ${totalRequested} questions

CRITICAL: You MUST return a valid JSON object with the EXACT structure below. Do not include any text before or after the JSON:

{
  "questions": [
    {
      "type": "mcq",
      "text": "Question text here",
      "options": [
        {"label": "Option A", "isCorrect": true},
        {"label": "Option B", "isCorrect": false},
        {"label": "Option C", "isCorrect": false},
        {"label": "Option D", "isCorrect": false}
      ],
      "correctAnswer": "A",
      "explanation": "Explanation here",
      "mark": 1
    },
    {
      "type": "short_answer",
      "text": "Question text here",
      "correctAnswer": "Expected answer",
      "explanation": "Explanation here", 
      "mark": 2
    },
    {
      "type": "long_answer",
      "text": "Question text here",
      "correctAnswer": "Expected comprehensive answer",
      "explanation": "Explanation here",
      "mark": 5
    }
  ]
}`;

  const maxContextLength = Math.min(model.contextWindow - 3000, 12000);
  const truncatedContext = contextData.substring(0, maxContextLength);

  const userPrompt = `Context: ${truncatedContext}${
    contextData.length > maxContextLength ? "...(truncated)" : ""
  }

${aiPrompt ? `Additional Instructions: ${aiPrompt}` : ""}

Generate exactly ${targetMcq} MCQ questions, ${targetShort} short answer questions, and ${targetLong} long answer questions based on this context. Return ONLY the JSON object, no other text.`;

  console.log(
    `[Account ${accountId} - ${model.name}] Started at ${new Date(
      startTime
    ).toLocaleTimeString()} - Requesting: MCQ=${targetMcq}, Short=${targetShort}, Long=${targetLong}, Total=${totalRequested}`
  );

  try {
    const apiCallStart = Date.now();
    const completion = await groqInstance.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: model.id,
      temperature: 0.3,
      max_tokens: Math.min(model.maxTokens, 20000), // Ensure max_tokens is reasonable
    });
    const apiCallDuration = Date.now() - apiCallStart;

    const response = completion.choices[0]?.message?.content;
    const totalResponseTime = Date.now() - startTime;

    if (!response) {
      updateAccountHealth(accountId, false, totalResponseTime);
      throw new Error(`No response from Account ${accountId} - ${model.name}`);
    }

    // Parse JSON response
    const parseStart = Date.now();
    let parsedResponse;
    try {
      let jsonStr = response.trim();
      // Remove markdown code block fences if present
      jsonStr = jsonStr.replace(/^```json\s*/, "").replace(/\s*```$/, "");

      const jsonStart = jsonStr.indexOf("{");
      const jsonEnd = jsonStr.lastIndexOf("}");

      if (jsonStart === -1 || jsonEnd === -1 || jsonStart > jsonEnd) {
        throw new Error("No valid JSON structure found in response");
      }

      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error(
        `[Account ${accountId} - ${model.name}] Failed to parse response (length: ${response.length}):`,
        response.substring(0, 500) // Log only the beginning of a potentially large invalid response
      );
      updateAccountHealth(accountId, false, totalResponseTime);
      throw new Error(
        `Invalid JSON response from Account ${accountId} - ${model.name}: ${parseError.message}`
      );
    }
    const parseDuration = Date.now() - parseStart;

    const questions = parsedResponse.questions || [];

    // FIXED: Validate and trim questions to exact counts
    const mcqQuestions = questions
      .filter((q) => q.type === "mcq")
      .slice(0, targetMcq);
    const shortQuestions = questions
      .filter((q) => q.type === "short_answer")
      .slice(0, targetShort);
    const longQuestions = questions
      .filter((q) => q.type === "long_answer")
      .slice(0, targetLong);

    const validatedQuestions = [
      ...mcqQuestions,
      ...shortQuestions,
      ...longQuestions,
    ];

    const questionsPerSecond =
      validatedQuestions.length > 0
        ? (validatedQuestions.length / (totalResponseTime / 1000)).toFixed(2)
        : 0;

    console.log(
      `[Account ${accountId} - ${model.name}] ✅ Generated ${
        validatedQuestions.length
      }/${totalRequested} questions in ${formatDuration(
        totalResponseTime
      )} (${questionsPerSecond} q/s)`
    );
    console.log(
      `[Account ${accountId} - ${
        model.name
      }] Timing breakdown: API=${formatDuration(
        apiCallDuration
      )}, Parse=${formatDuration(parseDuration)}`
    );

    updateAccountHealth(accountId, true, totalResponseTime);

    return {
      account: accountId,
      model: model.name,
      questions: validatedQuestions,
      requestedCounts: { mcq: targetMcq, short: targetShort, long: targetLong },
      actualCounts: {
        mcq: mcqQuestions.length,
        short: shortQuestions.length,
        long: longQuestions.length,
      },
      timing: {
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString(),
        duration: totalResponseTime,
        formattedDuration: formatDuration(totalResponseTime),
        apiCallDuration: apiCallDuration,
        parseDuration: parseDuration,
        questionsPerSecond: parseFloat(questionsPerSecond),
      },
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(
      `[Account ${accountId} - ${model.name}] ❌ Failed after ${formatDuration(
        responseTime
      )}: ${error.message}`
    );
    updateAccountHealth(accountId, false, responseTime);
    throw error; // Rethrow to be caught by generateWithFallback or the main POST handler
  }
}

// Enhanced main POST function with comprehensive timing
export async function POST(request) {
  const overallStartTime = Date.now();
  let body,
    file,
    quizId,
    aiPrompt,
    contextText,
    targetMcq,
    targetShort,
    targetLong,
    totalRequested,
    contextData;

  try {
    // Parse request
    const contentType = request.headers.get("content-type");

    if (contentType && contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      body = {
        quizId: formData.get("quizId"),
        aiPrompt: formData.get("aiPrompt"),
        contextText: formData.get("contextText"),
        targetMcq: parseInt(formData.get("targetMcq")) || 0,
        targetShort: parseInt(formData.get("targetShort")) || 0,
        targetLong: parseInt(formData.get("targetLong")) || 0,
      };
      file = formData.get("contextFile");
    } else {
      body = await request.json();
    }

    quizId = body.quizId;
    aiPrompt = body.aiPrompt;
    contextText = body.contextText;
    targetMcq = parseInt(body.targetMcq) || 0;
    targetShort = parseInt(body.targetShort) || 0;
    targetLong = parseInt(body.targetLong) || 0;

    //at least total req should be greater than 1
    totalRequested = targetMcq + targetShort + targetLong;
    if (totalRequested === 0) {
      return NextResponse.json(
        { error: "At least one question type must be requested" },
        { status: 400 }
      );
    }
    //returning error if context&file both absent
    if (!contextText && !file) {
      return NextResponse.json(
        { error: "Context text or file is required" },
        { status: 400 }
      );
    }

    // Prepare context data by sending to extractTextFromFile
    contextData = contextText || "";
    if (file) {
      try {
        const extractedText = await extractTextFromFile(file);
        contextData = extractedText; // Or append: contextData += "\n\n" + extractedText;
      } catch (error) {
        return NextResponse.json(
          { error: `Failed to extract text from file: ${error.message}` },
          { status: 400 }
        );
      }
    }
    //by chance if a person sent a context data 100 spaces only then after
    // trim contextData will be null for that this checking
    if (!contextData.trim()) {
      return NextResponse.json(
        { error: "No valid context data found after processing" },
        { status: 400 }
      );
    }

    console.log(
      `🚀 Starting quiz generation at ${new Date().toLocaleTimeString()} for ${totalRequested} total questions (MCQ: ${targetMcq}, Short: ${targetShort}, Long: ${targetLong})`
    );

    // ✅ Fetch active models once (Next.js caches for 1 hour)
    const keys = getGroqApiKeys();
    const activeModelIds = await getActiveGroqModelIds(keys[0]);
    const dynamicModels = buildModelConfigs(activeModelIds);
    console.log(`[groq/route] Using ${dynamicModels.length} dynamic models, first: ${dynamicModels[0]?.id}`);

    // Select accounts and create distribution
    const distributionStart = Date.now();
    const selectedAccounts = selectOptimalAccounts(totalRequested);
    const distributions = calculateOptimalDistribution(
      targetMcq,
      targetShort,
      targetLong,
      selectedAccounts
    );
    const distributionTime = Date.now() - distributionStart;

    console.log(
      `📊 Distribution calculated in ${formatDuration(distributionTime)}:`,
      distributions
    );

    // Execute parallel generation
    const generationStart = Date.now();
    const generationPromises = distributions.map((dist) => {
      if (dist.mcq <= 0 && dist.short <= 0 && dist.long <= 0) {
        return Promise.resolve({
          account: dist.accountId,
          model: "Skipped",
          questions: [],
          requestedCounts: { mcq: 0, short: 0, long: 0 },
          actualCounts: { mcq: 0, short: 0, long: 0 },
          timing: {
            // Add timing object for skipped accounts
            startTime: new Date().toISOString(),
            duration: 0,
            formattedDuration: "0ms",
            questionsPerSecond: 0,
          },
        });
      }

      return generateWithFallback(
        groqInstances[dist.accountId - 1],
        contextData,
        aiPrompt,
        dist.mcq,
        dist.short,
        dist.long,
        dist.accountId,
        dynamicModels  // ✅ pass fetched models
      );
    });

    console.log(
      `⚡ Starting parallel generation across ${selectedAccounts.length} accounts...`
    );
    const results = await Promise.allSettled(generationPromises);
    console.log(" POST ~ results:", results);
    const generationTime = Date.now() - generationStart;

    // Process results
    const allQuestions = [];
    const errors = [];
    const accountResults = [];
    const successfulResults = [];
    const failedDistributions = [];

    results.forEach((result, index) => {
      const currentDistribution = distributions[index];
      if (result.status === "fulfilled") {
        // Ensure result.value and result.value.questions are defined
        if (result.value && Array.isArray(result.value.questions)) {
          allQuestions.push(...result.value.questions);
          successfulResults.push(result.value); // Store the whole fulfilled value
          accountResults.push({
            account: result.value.account,
            model: result.value.model,
            generated: result.value.questions.length,
            requested: result.value.requestedCounts,
            actual: result.value.actualCounts,
            timing: result.value.timing,
            efficiency:
              result.value.requestedCounts.mcq +
                result.value.requestedCounts.short +
                result.value.requestedCounts.long >
              0
                ? `${Math.round(
                    (result.value.questions.length /
                      (result.value.requestedCounts.mcq +
                        result.value.requestedCounts.short +
                        result.value.requestedCounts.long)) *
                      100
                  )}%`
                : "N/A",
          });
        } else if (result.value && result.value.model === "Skipped") {
          // Handle skipped accounts
          accountResults.push({
            account: result.value.account,
            model: "Skipped",
            generated: 0,
            requested: { mcq: 0, short: 0, long: 0 },
            actual: { mcq: 0, short: 0, long: 0 },
            timing: result.value.timing,
            efficiency: "N/A",
          });
        }
      } else if (result.status === "rejected") {
        const accountId = currentDistribution.accountId;
        console.error(`❌ Account ${accountId} failed:`, result.reason);
        errors.push({
          account: accountId,
          error: result.reason?.message || "Unknown error",
        });
        failedDistributions.push(currentDistribution);
      }
    });

    // Smart redistribution if generate failed
    if (failedDistributions.length > 0 && successfulResults.length > 0) {
      console.log("🔄 Attempting redistribution for failed tasks...");
      const redistributions = calculateRedistribution(
        { mcq: targetMcq, short: targetShort, long: targetLong },
        successfulResults, // Pass successful results for choosing best account
        failedDistributions
      );

      for (const redist of redistributions) {
        if (redist.mcq + redist.short + redist.long > 0) {
          try {
            console.log(
              `Retrying with Account ${redist.accountId} for: MCQ=${redist.mcq}, Short=${redist.short}, Long=${redist.long}`
            );
            const redistResult = await generateWithFallback(
              groqInstances[redist.accountId - 1],
              contextData,
              aiPrompt,
              redist.mcq,
              redist.short,
              redist.long,
              redist.accountId,
              dynamicModels  // ✅ reuse same fetched models
            );

            const currentTotal = {
              mcq: allQuestions.filter((q) => q.type === "mcq").length,
              short: allQuestions.filter((q) => q.type === "short_answer")
                .length,
              long: allQuestions.filter((q) => q.type === "long_answer").length,
            };

            const questionsToAdd = [];
            let mcqAdded = 0,
              shortAdded = 0,
              longAdded = 0;

            if (Array.isArray(redistResult.questions)) {
              redistResult.questions.forEach((question) => {
                if (
                  question.type === "mcq" &&
                  currentTotal.mcq + mcqAdded < targetMcq
                ) {
                  questionsToAdd.push(question);
                  mcqAdded++;
                } else if (
                  question.type === "short_answer" &&
                  currentTotal.short + shortAdded < targetShort
                ) {
                  questionsToAdd.push(question);
                  shortAdded++;
                } else if (
                  question.type === "long_answer" &&
                  currentTotal.long + longAdded < targetLong
                ) {
                  questionsToAdd.push(question);
                  longAdded++;
                }
              });
            }

            allQuestions.push(...questionsToAdd);
            console.log(
              `[Redistribution Account ${redistResult.account}] Added ${questionsToAdd.length} questions.`
            );

            accountResults.push({
              account: redistResult.account,
              model: redistResult.model + " (Redistribution)",
              generated: questionsToAdd.length,
              requested: redist, // The counts for this specific redistribution attempt
              actual: { mcq: mcqAdded, short: shortAdded, long: longAdded },
              timing: redistResult.timing,
              efficiency:
                redist.mcq + redist.short + redist.long > 0
                  ? `${Math.round(
                      (questionsToAdd.length /
                        (redist.mcq + redist.short + redist.long)) *
                        100
                    )}%`
                  : "N/A",
            });
          } catch (redistError) {
            console.error(
              `Redistribution failed for account ${redist.accountId}:`,
              redistError.message
            );
            errors.push({
              account: redist.accountId,
              error: `Redistribution failed: ${redistError.message}`,
            });
          }
        }
      }
    }
    // Check if all attempts failed even after redistribution
    if (allQuestions.length === 0 && errors.length === distributions.length) {
      return NextResponse.json(
        {
          error:
            "All selected accounts failed to generate questions, even after redistribution attempts.",
          details: errors,
        },
        { status: 500 }
      );
    }

    // FINAL SAFETY CHECK: Ensure we don't exceed requested counts
    const finalMcqQuestions = allQuestions
      .filter((q) => q.type === "mcq")
      .slice(0, targetMcq);
    const finalShortQuestions = allQuestions
      .filter((q) => q.type === "short_answer")
      .slice(0, targetShort);
    const finalLongQuestions = allQuestions
      .filter((q) => q.type === "long_answer")
      .slice(0, targetLong);

    const finalQuestions = [
      ...finalMcqQuestions,
      ...finalShortQuestions,
      ...finalLongQuestions,
    ];

    // Format all questions with correctAnswer
    const formattedQuestions = finalQuestions.map((question, index) => {
      const baseQuestion = {
        // id: `ai-${question.type}-${Date.now()}-${index}`, // Consider a more robust ID generation if needed
        type: question.type,
        text: question.text,
        explanation: question.explanation || "",
        mark:
          question.mark ||
          (question.type === "mcq"
            ? 1
            : question.type === "short_answer"
            ? 2
            : 5),
        order: index, // This will be relative to the finalQuestions array
        isFromPool: false, // Assuming these are not from a pre-generated pool
      };

      if (question.type === "mcq") {
        return {
          ...baseQuestion,
          options: question.options || [], // Ensure options is an array
          correctAnswer: "", // Provide a default if undefined
        };
      } else {
        return {
          ...baseQuestion,
          correctAnswer: question.correctAnswer || "", // Provide a default if undefined
        };
      }
    });

    const finalBreakdown = {
      mcq: formattedQuestions.filter((q) => q.type === "mcq").length,
      short_answer: formattedQuestions.filter((q) => q.type === "short_answer")
        .length,
      long_answer: formattedQuestions.filter((q) => q.type === "long_answer")
        .length,
    };

    const strategyUsed = `optimal_${selectedAccounts.length}_account${
      selectedAccounts.length > 1 ? "s" : ""
    }`;

    const overallTime = Date.now() - overallStartTime;
    const totalQuestionsGenerated = formattedQuestions.length;
    const overallQuestionsPerSecond =
      totalQuestionsGenerated > 0
        ? (totalQuestionsGenerated / (overallTime / 1000)).toFixed(2)
        : 0;

        //quiz time related things
    console.log(
      `🎉 Quiz generation completed in ${formatDuration(
        overallTime
      )} (${overallQuestionsPerSecond} q/s overall)`
    );
    console.log(
      `📈 Performance summary: Generated ${totalQuestionsGenerated}/${totalRequested} questions across ${selectedAccounts.length} accounts`
    );
    console.log(
      `Final Breakdown - MCQ: ${finalBreakdown.mcq}/${targetMcq}, Short: ${finalBreakdown.short_answer}/${targetShort}, Long: ${finalBreakdown.long_answer}/${targetLong}`
    );

    // Calculate timing statistics from successful account results
    const successfulTimings = accountResults
      .filter(
        (result) =>
          result.timing &&
          result.timing.duration > 0 &&
          result.model !== "Skipped"
      )
      .map((result) => result.timing.duration);

    const timingStats =
      successfulTimings.length > 0
        ? {
            fastest: Math.min(...successfulTimings),
            slowest: Math.max(...successfulTimings),
            average: Math.round(
              successfulTimings.reduce((a, b) => a + b, 0) /
                successfulTimings.length
            ),
          }
        : null;

    return NextResponse.json({
      success: true,
      questions: formattedQuestions,
      totalQuestions: formattedQuestions.length,
      strategy: strategyUsed,
      selectedAccounts,
      accountResults, // Contains detailed results per account, including timing
      timing: {
        overallDuration: overallTime,
        formattedOverallDuration: formatDuration(overallTime),
        distributionTime: distributionTime,
        formattedDistributionTime: formatDuration(distributionTime),
        generationTime: generationTime, // This is the parallel generation time
        formattedGenerationTime: formatDuration(generationTime),
        overallQuestionsPerSecond: parseFloat(overallQuestionsPerSecond),
        startTime: new Date(overallStartTime).toISOString(),
        endTime: new Date().toISOString(),
        stats: timingStats
          ? {
              fastest: formatDuration(timingStats.fastest),
              slowest: formatDuration(timingStats.slowest),
              average: formatDuration(timingStats.average),
            }
          : null,
      },
      accountHealth: Object.entries(accountHealth).map(([id, health]) => ({
        account: parseInt(id),
        successRate: Math.round(health.successRate * 100), // As percentage
        avgResponseTime: formatDuration(Math.round(health.avgResponseTime)),
        failures: health.failures,
      })),
      errors: errors.length > 0 ? errors : null,
      requested: {
        mcq: targetMcq,
        short_answer: targetShort,
        long_answer: targetLong,
        total: totalRequested,
      },
      breakdown: finalBreakdown,
      efficiency:
        totalRequested > 0
          ? `${Math.round((formattedQuestions.length / totalRequested) * 100)}%`
          : "N/A",
    });
  } catch (error) {
    const overallTime = Date.now() - overallStartTime;
    console.error(
      `❌ Top-level error in POST after ${formatDuration(overallTime)}:`,
      error
    );
//  FAILED TO GENERATE QUESTIONS
    return NextResponse.json(
      {
        error: "Failed to generate quiz questions due to an unexpected error.",
        details: error.message,
        timing: {
          overallDuration: overallTime,
          formattedOverallDuration: formatDuration(overallTime),
          failed: true,
        },
      },
      { status: 500 }
    );
  }
}
// --- FUNCTIONS FROM YOUR INSTRUCTION BLOCK END ---
