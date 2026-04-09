// /**
//  * Generate chat completion using Groq
//  * @param {string} prompt - The user prompt
//  * @param {Object} options - Configuration options
//  * @returns {Promise<string>} - Generated response
//  */
// export async function generateChatCompletion(prompt, options = {}) {
//   try {
//     if (!prompt) {
//       throw new Error("Prompt is required for chat completion.");
//     }

//     const config = { ...DEFAULT_CONFIG, ...options }; // Assumes DEFAULT_CONFIG is defined elsewhere

//     const completion = await groq.chat.completions.create({
//       // Assumes groq client is defined elsewhere
//       messages: [
//         {
//           role: "user",
//           content: prompt,
//         },
//       ],
//       model: config.model,
//       temperature: config.temperature,
//       max_tokens: config.max_tokens,
//       top_p: config.top_p,
//       stream: config.stream,
//     });

//     return completion.choices[0]?.message?.content || "";
//   } catch (error) {
//     console.error("Error generating chat completion with Groq:", error.message);
//     throw new Error(
//       `Failed to generate chat completion. Details: ${error.message}`
//     );
//   }
// }

// /**
//  * Generate chat completion with conversation history
//  * @param {Array} messages - Array of message objects with role and content
//  * @param {Object} options - Configuration options
//  * @returns {Promise<string>} - Generated response
//  */
// export async function generateChatWithHistory(messages, options = {}) {
//   try {
//     if (!messages || !Array.isArray(messages) || messages.length === 0) {
//       throw new Error("Messages array is required for chat completion.");
//     }

//     const config = { ...DEFAULT_CONFIG, ...options }; // Assumes DEFAULT_CONFIG is defined elsewhere

//     const completion = await groq.chat.completions.create({
//       // Assumes groq client is defined elsewhere
//       messages,
//       model: config.model,
//       temperature: config.temperature,
//       max_tokens: config.max_tokens,
//       top_p: config.top_p,
//       stream: config.stream,
//     });

//     return completion.choices[0]?.message?.content || "";
//   } catch (error) {
//     console.error(
//       "Error generating chat with history using Groq:",
//       error.message
//     );
//     throw new Error(
//       `Failed to generate chat with history. Details: ${error.message}`
//     );
//   }
// }

// /**
//  * Generate quiz questions using Groq
//  * @param {string} topic - The topic for quiz generation
//  * @param {number} questionCount - Number of questions to generate
//  * @param {string} difficulty - Difficulty level (easy, medium, hard)
//  * @returns {Promise<Object>} - Generated quiz data
//  */
// export async function generateQuizQuestions(
//   topic,
//   questionCount = 5,
//   difficulty = "medium"
// ) {
//   try {
//     if (!topic) {
//       throw new Error("Topic is required for quiz generation.");
//     }

//     const prompt = `Generate ${questionCount} ${difficulty} level multiple choice questions about ${topic}. 
//       Format the response as a JSON object with the following structure:
//       {
//         "questions": [
//           {
//             "question": "Question text here",
//             "options": ["A", "B", "C", "D"],
//             "correctAnswer": "A",
//             "explanation": "Brief explanation of the correct answer"
//           }
//         ]
//       }`;

//     const response = await generateChatCompletion(prompt, {
//       // Assumes generateChatCompletion is defined
//       temperature: 0.8,
//       max_tokens: 2048,
//     });

//     // Parse the JSON response
//     try {
//       return JSON.parse(response);
//     } catch (parseError) {
//       console.error("Error parsing quiz JSON:", parseError);
//       throw new Error("Failed to parse generated quiz questions.");
//     }
//   } catch (error) {
//     console.error(
//       `Error generating quiz questions for topic "${topic}":`,
//       error.message
//     );
//     throw new Error(
//       `Failed to generate quiz questions. Details: ${error.message}`
//     );
//   }
// }

// /**
//  * Generate content summary using Groq
//  * @param {string} content - Content to summarize
//  * @param {number} maxLength - Maximum length of summary
//  * @returns {Promise<string>} - Generated summary
//  */
// export async function generateSummary(content, maxLength = 200) {
//   try {
//     if (!content) {
//       throw new Error("Content is required for summary generation.");
//     }

//     const prompt = `Summarize the following content in approximately ${maxLength} words:
  
//   ${content}`;

//     return await generateChatCompletion(prompt, {
//       // Assumes generateChatCompletion is defined
//       temperature: 0.3,
//       max_tokens: Math.min(maxLength * 2, 1024),
//     });
//   } catch (error) {
//     console.error("Error generating summary with Groq:", error.message);
//     throw new Error(`Failed to generate summary. Details: ${error.message}`);
//   }
// }

// /**
//  * Stream chat completion (for real-time responses)
//  * @param {string} prompt - The user prompt
//  * @param {Function} onChunk - Callback function for each chunk
//  * @param {Object} options - Configuration options
//  */
// export async function streamChatCompletion(prompt, onChunk, options = {}) {
//   try {
//     if (!prompt) {
//       throw new Error("Prompt is required for streaming chat completion.");
//     }

//     if (typeof onChunk !== "function") {
//       throw new Error("onChunk callback function is required for streaming.");
//     }

//     const config = { ...DEFAULT_CONFIG, ...options, stream: true }; // Assumes DEFAULT_CONFIG is defined elsewhere

//     const stream = await groq.chat.completions.create({
//       // Assumes groq client is defined elsewhere
//       messages: [
//         {
//           role: "user",
//           content: prompt,
//         },
//       ],
//       model: config.model,
//       temperature: config.temperature,
//       max_tokens: config.max_tokens,
//       top_p: config.top_p,
//       stream: true,
//     });

//     for await (const chunk of stream) {
//       const content = chunk.choices[0]?.delta?.content || "";
//       if (content) {
//         onChunk(content);
//       }
//     }
//   } catch (error) {
//     console.error("Error streaming chat completion with Groq:", error.message);
//     throw new Error(
//       `Failed to stream chat completion. Details: ${error.message}`
//     );
//   }
// }

// // From: pages/api/chat.js (Pages Router)
// export default async function handler(req, res) {
//   // Note: This is a default export
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method not allowed" });
//   }

//   try {
//     const { prompt, options } = req.body;

//     if (!prompt) {
//       return res.status(400).json({ error: "Prompt is required" });
//     }

//     const response = await generateChatCompletion(prompt, options); // Assumes generateChatCompletion is defined

//     res.status(200).json({ response });
//   } catch (error) {
//     console.error("API Error:", error.message);
//     res.status(500).json({ error: "Failed to generate response" });
//   }
// }

// // From: app/api/chat/route.js (App Router)
// export async function POST(request) {
//   try {
//     const { prompt, options } = await request.json();

//     if (!prompt) {
//       return NextResponse.json(
//         { error: "Prompt is required" },
//         { status: 400 }
//       ); // Assumes NextResponse is imported
//     }

//     const response = await generateChatCompletion(prompt, options); // Assumes generateChatCompletion is defined

//     return NextResponse.json({ response }); // Assumes NextResponse is imported
//   } catch (error) {
//     console.error("API Error:", error.message);
//     return NextResponse.json(
//       { error: "Failed to generate response" },
//       { status: 500 }
//     ); // Assumes NextResponse is imported
//   }
// }

// // From: Component Example (Client Component)
// // This is not a standalone function but part of a component's logic
// // async function handleSubmit(e) { // This would be inside a component
// //   e.preventDefault();
// //   setLoading(true); // Assumes setLoading state hook
// //
// //   try {
// //     const res = await fetch('/api/chat', {
// //       method: 'POST',
// //       headers: {
// //         'Content-Type': 'application/json',
// //       },
// //       body: JSON.stringify({ prompt }), // Assumes prompt state hook
// //     });
// //
// //     const data = await res.json();
// //     setResponse(data.response); // Assumes setResponse state hook
// //   } catch (error) {
// //     console.error('Error:', error);
// //   } finally {
// //     setLoading(false); // Assumes setLoading state hook
// //   }
// // };

// // From: Server Component Example
// // This is a React Server Component, not just a standalone function
// // export default async function ServerComponent() {
// //   const response = await generateChatCompletion('Explain quantum computing in simple terms'); // Assumes generateChatCompletion
// //
// //   return <div>{response}</div>;
// // }
