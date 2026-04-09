"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import { ManualQuizEditor } from "./manual-quiz-editor";
import Info from "../../../../../components/info";

export const AIFixedQuizGenerator = ({ quizData, setQuizData }) => {
  const [aiPrompt, setAiPrompt] = useState(quizData.aiPrompt || "");
  const [contextText, setContextText] = useState("");
  const [contextFile, setContextFile] = useState(null);
  const [targetMcq, setTargetMcq] = useState(quizData.targetMcqCount || 5);
  const [targetShort, setTargetShort] = useState(quizData.targetShortAnswerCount || 2);
  const [targetLong, setTargetLong] = useState(quizData.targetLongAnswerCount || 0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setContextFile(file);
  };

  const handleGenerate = async () => {
    if (!aiPrompt && !contextText && !contextFile) {
      toast.error("Please provide a prompt or context data.");
      return;
    }

    if (targetMcq + targetShort + targetLong === 0) {
      toast.error("Please specify at least one question type.");
      return;
    }

    setIsGenerating(true);

    try {
      console.log("Generating AI quiz with Groq:", quizData.id);

      let response;

      // Prepare form data if file is provided, otherwise use JSON
      if (contextFile) {
        const formData = new FormData();

        formData.append('quizId', quizData.id);
        formData.append('aiPrompt', aiPrompt || '');
        formData.append('contextText', contextText || '');
        formData.append('contextFile', contextFile);
        formData.append('targetMcq', targetMcq.toString());
        formData.append('targetShort', targetShort.toString());
        formData.append('targetLong', targetLong.toString());
        console.log(" handleGenerate ~ formData:", formData)
        response = await fetch('/api/quiz/groq', {
          method: 'POST',
          body: formData
        });
      } else {
        // Use JSON for text-only requests
        response = await fetch('/api/quiz/groq', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quizId: quizData.id,
            aiPrompt,
            contextText,
            targetMcq,
            targetShort,
            targetLong
          })
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to generate quiz');
      }

      const result = await response.json();
      const generatedQuestions = result.questions;

      setQuizData(prev => ({
        ...prev,
        questions: generatedQuestions,
        targetMcqCount: targetMcq,
        targetShortAnswerCount: targetShort,
        targetLongAnswerCount: targetLong,
        aiPrompt: aiPrompt
      }));

      // Show success modal instead of toast
      setShowSuccessModal(true);

    } catch (error) {
      toast.error("AI generation failed: " + error.message);
      console.error('Quiz generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalQuestions = targetMcq + targetShort + targetLong;
  let info = "Generating Questions can take upto 1 minute."

  return (
      <div className="mt-6 bg-card border border-border rounded-md p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-row gap-2">
            <h3 className="text-lg font-poppins font-bold text-card-foreground">AI-Generated Quiz</h3>
            <Info info={info}/>
          </div>
          <div className="text-sm text-muted-foreground">
            Total: {totalQuestions} questions
          </div>
        </div>

        <div>
          <Label htmlFor="aiPrompt" className="text-card-foreground font-poppins font-bold">Custom Prompt (Optional)</Label>
          <Textarea
              id="aiPrompt"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., Generate questions focusing on the key concepts of Chapter 3, include practical examples..."
              rows={3}
              disabled={isGenerating}
              className="bg-input border-border text-foreground"
          />
        </div>

        <div>
          <Label htmlFor="contextText" className="text-card-foreground font-poppins font-bold">Context Data (Paste Text)</Label>
          <Textarea
              id="contextText"
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
              placeholder="Paste your document text here..."
              rows={8}
              disabled={isGenerating}
              className="bg-input border-border text-foreground"
          />
        </div>

        <div className="text-sm text-center my-2 text-muted-foreground">OR</div>

        <div>
          <Label htmlFor="contextFile" className="text-card-foreground font-poppins font-bold">Context Data (Upload PDF, DOCX, TXT)</Label>
          <Input
              id="contextFile"
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              disabled={isGenerating}
              className="bg-input border-border text-foreground"
          />
          {contextFile && (
              <p className="text-xs mt-1 text-muted-foreground">
                Selected: {contextFile.name} ({(contextFile.size / 1024).toFixed(1)} KB)
              </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="targetMcq" className="text-card-foreground font-poppins font-bold">Multiple Choice Questions</Label>
            <Input
                id="targetMcq"
                type="number"
                value={targetMcq}
                onChange={(e) => setTargetMcq(parseInt(e.target.value, 10) || 0)}
                min="0"
                max="20"
                disabled={isGenerating}
                className="bg-input border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">1 mark each</p>
          </div>
          <div>
            <Label htmlFor="targetShort" className="text-card-foreground font-poppins font-bold">Short Answer Questions</Label>
            <Input
                id="targetShort"
                type="number"
                value={targetShort}
                onChange={(e) => setTargetShort(parseInt(e.target.value, 10) || 0)}
                min="0"
                max="10"
                disabled={isGenerating}
                className="bg-input border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">2 marks each</p>
          </div>
          <div>
            <Label htmlFor="targetLong" className="text-card-foreground font-poppins font-bold">Long Answer Questions</Label>
            <Input
                id="targetLong"
                type="number"
                value={targetLong}
                onChange={(e) => setTargetLong(parseInt(e.target.value, 10) || 0)}
                min="0"
                max="5"
                disabled={isGenerating}
                className="bg-input border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">5 marks each</p>
          </div>
        </div>

        <div className="p-3 bg-card rounded border border-border text-sm">
          <p className="text-card-foreground"><strong>Total Marks:</strong> {targetMcq * 1 + targetShort * 2 + targetLong * 5}</p>
          <p className="mt-1 text-muted-foreground">
            MCQ: {targetMcq} × 1 = {targetMcq} marks |
            Short: {targetShort} × 2 = {targetShort * 2} marks |
            Long: {targetLong} × 5 = {targetLong * 5} marks
          </p>
        </div>

        <Button
            onClick={handleGenerate}
            disabled={isGenerating || totalQuestions === 0}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating {totalQuestions} Questions...
              </>
          ) : (
              `Generate ${totalQuestions} Questions with AI`
          )}
        </Button>

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="sm:max-w-md bg-popover border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-popover-foreground font-poppins font-bold">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Quiz Generated Successfully!
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Generated {quizData.questions?.length || 0} questions successfully!
                You can now edit the questions below or save the quiz.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button onClick={() => setShowSuccessModal(false)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Continue Editing
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {/*gg*/}
        {quizData.questions && quizData.questions.length > 0 && (
            <div className="mt-8">
              <ManualQuizEditor quizData={quizData} setQuizData={setQuizData} />
            </div>
        )}
      </div>
  );
};