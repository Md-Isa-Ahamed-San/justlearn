"use client";

import { cn } from "@/lib/utils";
import { Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from 'react-markdown';

export function AITutorWidget({ lessonContext }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Hi! I'm your AI Tutor. I can help explain concepts from this lesson. What are you stuck on?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: "user", content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/ai/tutor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: messages.slice(-4), // Send recent history
                    lessonContext: lessonContext
                })
            });

            const data = await response.json();
            
            if (data.error) throw new Error(data.error);

            setMessages(prev => [...prev, { role: "assistant", content: data.response }]);

        } catch (error) {
            console.error("Tutor Error:", error);
            setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            <div 
                className={cn(
                    "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl w-[350px] md:w-[400px] h-[500px] flex flex-col transition-all duration-300 origin-bottom-right pointer-events-auto mb-4 overflow-hidden",
                    isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none h-0 w-0"
                )}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 flex items-center justify-between text-white shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">AI Tutor</h3>
                            <p className="text-xs text-indigo-100">Always here to help</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
                    {messages.map((msg, idx) => (
                        <div 
                            key={idx} 
                            className={cn(
                                "flex w-max max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                                msg.role === "user" 
                                    ? "ml-auto bg-violet-600 text-white rounded-br-sm" 
                                    : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-200 rounded-bl-sm"
                            )}
                        >
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 w-16 flex items-center justify-center">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-violet-500/20 transition-shadow">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question..."
                            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-400"
                        />
                        <button 
                            type="submit" 
                            disabled={!input.trim() || isLoading}
                            className="p-1.5 bg-violet-600 text-white rounded-full hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="text-center mt-2.5">
                        <p className="text-[10px] text-slate-400">
                            AI explanations may be inaccurate. Always verify with course material.
                        </p>
                    </div>
                </form>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 pointer-events-auto",
                    isOpen 
                        ? "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300" 
                        : "bg-gradient-to-tr from-violet-600 to-indigo-600 text-white animate-in zoom-in slide-in-from-bottom-4 duration-500"
                )}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
            </button>
        </div>
    );
}
