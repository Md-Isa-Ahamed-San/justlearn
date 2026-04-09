import {Checkbox} from "@/components/ui/checkbox";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";

export default function QuizQuestion({ question, answer, onAnswerChange, disabled }) {
    const handleMCQChange = (checked, optionLabel,isCorrect) => {
        const currentAnswers = answer?.answer || []
       
        let newAnswers
        if (checked) {
            newAnswers = [...currentAnswers, optionLabel]
        } else {
            newAnswers = currentAnswers.filter((label) => label !== optionLabel)
        }

        onAnswerChange(question.id,question.text, newAnswers, 'mcq',question?.mark,isCorrect)
    }

    switch (question.type) {
        case 'mcq':
            return (
                <div className="space-y-4">
                    <p className="text-lg font-medium text-card-foreground">{question.text}</p>
                    <div className="space-y-3">
                        {question.options.map((opt, i) => (
                            <div key={i} className="flex items-center space-x-3 rounded-md border p-3 hover:bg-accent/50 transition-colors">
                                <Checkbox
                                    id={`q-${question.id}-opt-${i}`}
                                    checked={answer?.answer?.includes(opt.label) || false}
                                    onCheckedChange={(checked) => handleMCQChange(checked, opt.label,opt.isCorrect)}
                                    disabled={disabled}
                                />
                                <Label htmlFor={`q-${question.id}-opt-${i}`} className="text-base font-normal cursor-pointer flex-1">
                                    {opt.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            )
        case 'short_answer':
            return (
                <div className="space-y-4">
                    <p className="text-lg font-medium text-card-foreground">{question.text}</p>
                    <Input
                        placeholder="Type your short answer here..."
                        value={answer?.answer || ""}
                        onChange={(e) => onAnswerChange(question.id,question.text, e.target.value, 'short_answer',question?.mark)}
                        disabled={disabled}
                    />
                </div>
            )
        case 'long_answer':
            return (
                <div className="space-y-4">
                    <p className="text-lg font-medium text-card-foreground">{question.text}</p>
                    <Textarea
                        placeholder="Type your detailed answer here..."
                        value={answer?.answer || ""}
                        onChange={(e) => onAnswerChange(question.id,question.text, e.target.value, 'long_answer',question?.mark)}
                        rows={8}
                        disabled={disabled}
                    />
                </div>
            )
        default:
            return <p>Unsupported question type.</p>
    }
}
