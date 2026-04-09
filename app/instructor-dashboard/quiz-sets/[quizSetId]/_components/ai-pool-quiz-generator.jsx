"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ManualQuizEditor } from "@/app/instructor-dashboard/quiz-sets/[quizSetId]/_components/manual-quiz-editor";
import Info from "../../../../../components/info";

export const AIPoolQuizGenerator = ({ quizData, setQuizData }) => {
    // AI Generation Inputs
    const [aiPrompt, setAiPrompt] = useState(quizData.aiPrompt || "");
    const [contextText, setContextText] = useState("");
    const [contextFile, setContextFile] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Pool Size Configuration (Total questions in the pool)
    const [targetMcq, setTargetMcq] = useState(quizData.targetMcqCount || 10);
    const [targetShort, setTargetShort] = useState(quizData.targetShortAnswerCount || 8);
    const [targetLong, setTargetLong] = useState(quizData.targetLongAnswerCount || 2);

    // Per-Student Configuration (Questions each student will receive)
    const [MCQPerStudent, setMCQPerStudent] = useState(quizData.MCQPerStudent || 5);
    const [shortQuestionsPerStudent, setShortQuestionsPerStudent] = useState(quizData.shortQuestionsPerStudent || 3);
    const [longQuestionsPerStudent, setLongQuestionsPerStudent] = useState(quizData.longQuestionsPerStudent || 1);

    // Derived values for easier calculations and display
    // FIX: poolSize is now always calculated from the current target counts for consistency.
    const poolSize = targetMcq + targetShort + targetLong;
    const totalQuestionsPerStudent = MCQPerStudent + shortQuestionsPerStudent + longQuestionsPerStudent;
    const totalMarksPerStudent = (MCQPerStudent * 1) + (shortQuestionsPerStudent * 2) + (longQuestionsPerStudent * 5);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setContextFile(file);
        if (file) {
            setContextText("");
        }
    };

    const handleGenerate = async () => {
        // --- Validation ---
        if (!aiPrompt && !contextText && !contextFile) {
            toast.error("Please provide a prompt or context data to generate questions.");
            return;
        }
        if (poolSize === 0) {
            toast.error("Please specify a target number for at least one question type.");
            return;
        }
        if (totalQuestionsPerStudent === 0) {
            toast.error("Please set the number of questions per student for at least one type.");
            return;
        }
        if (MCQPerStudent > targetMcq) {
            toast.error(`MCQs per student (${MCQPerStudent}) cannot exceed the total MCQs in the pool (${targetMcq}).`);
            return;
        }
        if (shortQuestionsPerStudent > targetShort) {
            toast.error(`Short questions per student (${shortQuestionsPerStudent}) cannot exceed the total in the pool (${targetShort}).`);
            return;
        }
        if (longQuestionsPerStudent > targetLong) {
            toast.error(`Long questions per student (${longQuestionsPerStudent}) cannot exceed the total in the pool (${targetLong}).`);
            return;
        }

        setIsGenerating(true);

        try {
            console.log("Generating AI pool quiz with Groq:", quizData.id);

            let response;
            const commonPayload = {
                quizId: quizData.id,
                aiPrompt,
                contextText,
                poolSize,
                targetMcq,
                targetShort,
                targetLong,
                MCQPerStudent,
                shortQuestionsPerStudent,
                longQuestionsPerStudent,
                generationType: 'ai_pool'
            };

            if (contextFile) {
                const formData = new FormData();
                Object.entries(commonPayload).forEach(([key, value]) => {
                    formData.append(key, value.toString());
                });
                formData.append('contextFile', contextFile);

                response = await fetch('/api/quiz/groq', {
                    method: 'POST',
                    body: formData
                });
            } else {
                response = await fetch('/api/quiz/groq', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(commonPayload)
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || 'Failed to generate quiz pool');
            }

            const result = await response.json();
            const generatedQuestions = result.questions;

            setQuizData(prev => ({
                ...prev,
                questions: generatedQuestions,
                poolSize: poolSize,
                MCQPerStudent: MCQPerStudent,
                shortQuestionsPerStudent: shortQuestionsPerStudent,
                longQuestionsPerStudent: longQuestionsPerStudent,
                targetMcqCount: targetMcq,
                targetShortAnswerCount: targetShort,
                targetLongAnswerCount: targetLong,
                aiPrompt: aiPrompt,
                generationType: 'ai_pool'
            }));

            toast.success(`Question pool of ${generatedQuestions.length} questions generated successfully!`);
        } catch (error) {
            toast.error("AI pool generation failed: " + error.message);
            console.error('Pool generation error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const hasGeneratedQuestions = quizData.questions && quizData.questions.length > 0;
    const info = "Generating a large question pool can take up to 2 minutes.";

    return (
        <div className="mt-6 bg-card border border-border rounded-lg p-2 md:space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-y-2">
                <div className="flex flex-row gap-2 items-center">
                    <h3 className="text-center md:text-start text-lg font-poppins font-bold text-card-foreground">AI-Generated Quiz Pool</h3>
                    <Info info={info}/>
                </div>
                {/* FIX: Correctly display the pool breakdown for each question type */}
                <div className="flex flex-wrap gap-2">
                    <div className="text-xs text-center text-muted-foreground px-2 py-1 rounded-md border border-border">
                        MCQ: {targetMcq} → {MCQPerStudent}/std
                    </div>
                    <div className="text-xs text-center text-muted-foreground px-2 py-1 rounded-md border border-border">
                        Short: {targetShort} → {shortQuestionsPerStudent}/std
                    </div>
                    <div className="text-xs text-center text-muted-foreground px-2 py-1 rounded-md border border-border">
                        Long: {targetLong} → {longQuestionsPerStudent}/std
                    </div>
                </div>
            </div>

            {!hasGeneratedQuestions && (
                <>
                    <div className="space-y-4 p-4">
                        {/* --- AI INPUTS --- */}
                        <div>
                            <Label htmlFor="aiPoolPrompt" className="text-sm font-poppins font-bold text-card-foreground">
                                Custom Prompt <span className="text-muted-foreground">(Optional)</span>
                            </Label>
                            <Textarea id="aiPoolPrompt" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g., Generate diverse questions about React hooks..." rows={3} disabled={isGenerating} className="mt-1 bg-input border-border text-foreground" />
                        </div>
                        <div>
                            <Label htmlFor="poolContextText" className="text-sm font-poppins font-bold text-card-foreground">
                                Context Data <span className="text-muted-foreground">(Paste Text)</span>
                            </Label>
                            <Textarea id="poolContextText" value={contextText} onChange={(e) => setContextText(e.target.value)} placeholder="Paste your document text, lecture notes, or study material here..." rows={8} disabled={isGenerating || !!contextFile} className="mt-1 font-mono text-sm bg-input border-border text-foreground" />
                        </div>
                        <div className="flex items-center justify-center">
                            <div className="text-sm text-muted-foreground px-4 py-1 rounded-full border border-border">OR</div>
                        </div>
                        <div>
                            <Label htmlFor="poolContextFile" className="text-sm font-poppins font-bold text-card-foreground">
                                Upload Context File <span className="text-muted-foreground">(PDF, DOCX, TXT)</span>
                            </Label>
                            <Input id="poolContextFile" type="file" accept=".pdf,.docx,.txt" onChange={handleFileChange} disabled={isGenerating || !!contextText} className="mt-1 bg-input border-border text-foreground" />
                            {contextFile && <p className="text-xs mt-2 text-green-600 bg-green-50 px-2 py-1 rounded">✓ Selected: {contextFile.name} ({(contextFile.size / 1024).toFixed(1)} KB)</p>}
                        </div>

                        {/* --- POOL SIZE CONFIGURATION --- */}
                        <div>
                            <Label className="text-sm font-poppins font-bold text-card-foreground mb-3 block">Total Questions in Pool</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="targetMcq" className="text-sm font-poppins font-bold text-card-foreground">Multiple Choice</Label>
                                    <Input id="targetMcq" type="number" value={targetMcq} onChange={(e) => setTargetMcq(parseInt(e.target.value, 10) || 0)} min="0" max="50" disabled={isGenerating} className="mt-1 bg-input border-border text-foreground" />
                                    <p className="text-xs text-muted-foreground mt-1">1 mark each</p>
                                </div>
                                <div>
                                    <Label htmlFor="targetShort" className="text-sm font-poppins font-bold text-card-foreground">Short Answer</Label>
                                    <Input id="targetShort" type="number" value={targetShort} onChange={(e) => setTargetShort(parseInt(e.target.value, 10) || 0)} min="0" max="30" disabled={isGenerating} className="mt-1 bg-input border-border text-foreground" />
                                    <p className="text-xs text-muted-foreground mt-1">2 marks each</p>
                                </div>
                                <div>
                                    <Label htmlFor="targetLong" className="text-sm font-poppins font-bold text-card-foreground">Long Answer</Label>
                                    <Input id="targetLong" type="number" value={targetLong} onChange={(e) => setTargetLong(parseInt(e.target.value, 10) || 0)} min="0" max="20" disabled={isGenerating} className="mt-1 bg-input border-border text-foreground" />
                                    <p className="text-xs text-muted-foreground mt-1">5 marks each</p>
                                </div>
                            </div>
                        </div>

                        {/* --- PER-STUDENT CONFIGURATION --- */}
                        <div>
                            <Label className="text-sm font-poppins font-bold text-card-foreground mb-3 block">Questions per Student</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="MCQPerStudent" className="text-sm font-poppins font-bold text-card-foreground">MCQs per Student</Label>
                                    <Input id="MCQPerStudent" type="number" value={MCQPerStudent} onChange={(e) => setMCQPerStudent(Math.max(0, parseInt(e.target.value, 10) || 0))} min="0" max={targetMcq} disabled={isGenerating} className="mt-1 bg-input border-border text-foreground" />
                                    <p className="text-xs text-muted-foreground mt-1">Random subset from pool</p>
                                </div>
                                <div>
                                    <Label htmlFor="shortQuestionsPerStudent" className="text-sm font-poppins font-bold text-card-foreground">Short Qs per Student</Label>
                                    <Input id="shortQuestionsPerStudent" type="number" value={shortQuestionsPerStudent} onChange={(e) => setShortQuestionsPerStudent(Math.max(0, parseInt(e.target.value, 10) || 0))} min="0" max={targetShort} disabled={isGenerating} className="mt-1 bg-input border-border text-foreground" />
                                    <p className="text-xs text-muted-foreground mt-1">Random subset from pool</p>
                                </div>
                                <div>
                                    <Label htmlFor="longQuestionsPerStudent" className="text-sm font-poppins font-bold text-card-foreground">Long Qs per Student</Label>
                                    <Input id="longQuestionsPerStudent" type="number" value={longQuestionsPerStudent} onChange={(e) => setLongQuestionsPerStudent(Math.max(0, parseInt(e.target.value, 10) || 0))} min="0" max={targetLong} disabled={isGenerating} className="mt-1 bg-input border-border text-foreground" />
                                    <p className="text-xs text-muted-foreground mt-1">Random subset from pool</p>
                                </div>
                            </div>
                        </div>

                        {/* --- SUMMARY & ACTION --- */}
                        <div className="p-4 bg-background rounded-lg border border-border">
                            <h4 className="text-sm font-poppins font-bold text-card-foreground mb-2">Quiz Summary</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-card-foreground"><strong>Total Pool Size:</strong> {poolSize} questions</p>
                                    <p className="text-muted-foreground mt-1">MCQ: {targetMcq} | Short: {targetShort} | Long: {targetLong}</p>
                                </div>
                                <div>
                                    <p className="text-card-foreground"><strong>Per Student:</strong> {totalQuestionsPerStudent} questions</p>
                                    <p className="text-muted-foreground mt-1">Total Marks: {totalMarksPerStudent}</p>
                                </div>
                            </div>
                        </div>

                        <Button onClick={handleGenerate} disabled={isGenerating || (!aiPrompt && !contextText && !contextFile) || poolSize === 0} className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                            {isGenerating ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating Question Pool...</>
                            ) : (
                                `Generate Pool of ${poolSize} Questions with AI`
                            )}
                        </Button>
                    </div>
                </>
            )}

            {hasGeneratedQuestions && (
                <div className="mt-8">
                    <ManualQuizEditor quizData={quizData} setQuizData={setQuizData} />
                </div>
            )}
        </div>
    );
};