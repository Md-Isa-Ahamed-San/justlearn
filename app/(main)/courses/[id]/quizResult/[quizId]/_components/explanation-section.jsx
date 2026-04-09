'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ExplanationSection({
                                       answerExplanation,
                                       questionExplanation,
                                       status
                                   }) {
    const [expanded, setExpanded] = useState(false)

    // Don't render if no explanations available
    if (!answerExplanation && !questionExplanation) {
        return null
    }

    const getStatusColor = () => {
        switch (status) {
            case 'correct':
                return 'text-green-700'
            case 'partial':
                return 'text-yellow-700'
            case 'incorrect':
                return 'text-red-700'
            default:
                return 'text-foreground'
        }
    }

    return (
        <div className="mt-4 border-t border-border pt-4">
            <Button
                variant="ghost"
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-foreground hover:bg-accent hover:text-accent-foreground p-2 h-auto"
            >
                <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                        expanded ? 'rotate-180' : ''
                    }`}
                />
                <span className="font-poppins font-bold text-sm">
          View Explanation
        </span>
            </Button>

            {expanded && (
                <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {/* Answer Feedback */}
                    {answerExplanation && (
                        <div className="bg-card rounded-lg border border-border p-4">
                            <h5 className="font-poppins font-bold text-sm text-foreground mb-2 flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                    status === 'correct' ? 'bg-green-500' :
                                        status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                                }`} />
                                Answer Feedback:
                            </h5>
                            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                                {answerExplanation}
                            </p>
                        </div>
                    )}

                    {/* Question Explanation */}
                    {questionExplanation && (
                        <div className="bg-card rounded-lg border border-border p-4">
                            <h5 className="font-poppins font-bold text-sm text-foreground mb-2 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                Topic Explanation:
                            </h5>
                            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                                {questionExplanation}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}