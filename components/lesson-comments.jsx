"use client";

import { addComment, deleteComment, getLessonComments } from "@/app/actions/lesson";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Reply, Send, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function LessonComments({ lessonId }) {
    const { data: session } = useSession();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadComments();
    }, [lessonId]);

    const loadComments = async () => {
        try {
            const { success, comments, error } = await getLessonComments(lessonId);
            if (success) setComments(comments);
            else toast.error("Failed to load comments");
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        
        try {
            const { success, comment, error } = await addComment(lessonId, newComment);
            
            if (success) {
                setNewComment("");
                // Optimistic update or reload
                loadComments(); 
                toast.success("Comment posted!");
            } else {
                toast.error(error || "Failed to post comment");
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const handleReply = async (parentId) => {
        if (!replyContent.trim()) return;

        try {
            const { success, error } = await addComment(lessonId, replyContent, parentId);
            
            if (success) {
                setReplyContent("");
                setReplyingTo(null);
                loadComments();
                toast.success("Reply posted!");
            } else {
                toast.error(error || "Failed to reply");
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const handleDelete = async (commentId) => {
        if (!confirm("Are you sure you want to delete this comment?")) return;

        try {
            const { success, error } = await deleteComment(commentId);
            if (success) {
                loadComments();
                toast.success("Comment deleted");
            } else {
                toast.error(error || "Failed to delete");
            }
        } catch (error) {
            toast.error("Error deleting comment");
        }
    };

    if (isLoading) return <div className="text-center py-4 text-gray-500">Loading discussion...</div>;

    return (
        <div className="mt-8 space-y-6">
            <h3 className="text-xl font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Discussion
            </h3>

            {/* New Comment Input */}
            <div className="flex gap-4">
                <Avatar>
                    <AvatarImage src={session?.user?.image} />
                    <AvatarFallback>{session?.user?.name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                    <Textarea 
                        placeholder="Ask a question or share your thoughts..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[100px]"
                    />
                    <div className="flex justify-end">
                        <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                            Post Comment
                        </Button>
                    </div>
                </div>
            </div>

            {/* Comments List */}
            <div className="space-y-6">
                {comments.length === 0 && (
                    <p className="text-center text-gray-500 py-8 italic">No comments yet. Be the first to start the discussion!</p>
                )}
                
                {comments.map((comment) => (
                    <div key={comment.id} className="group">
                        <div className="flex gap-4">
                            <Avatar className="w-10 h-10">
                                <AvatarImage src={comment.user?.image} />
                                <AvatarFallback>{comment.user?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">{comment.user?.name}</span>
                                        <span className="text-xs text-gray-500">
                                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    {session?.user?.id === comment.userId && (
                                        <button 
                                            onClick={() => handleDelete(comment.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{comment.content}</p>
                                
                                <button 
                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                                >
                                    <Reply className="w-3 h-3" /> Reply
                                </button>

                                {/* Reply Input */}
                                {replyingTo === comment.id && (
                                    <div className="mt-3 flex gap-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="w-0.5 bg-gray-200 self-stretch ml-4" />
                                        <div className="flex-1 flex gap-2">
                                            <Textarea 
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                placeholder="Write a reply..."
                                                className="min-h-[60px] text-sm"
                                            />
                                            <Button size="icon" onClick={() => handleReply(comment.id)}>
                                                <Send className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Nested Replies */}
                                {comment.children && comment.children.length > 0 && (
                                    <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-100 dark:border-gray-800">
                                        {comment.children.map(reply => (
                                            <div key={reply.id} className="flex gap-3 group/reply">
                                                <Avatar className="w-8 h-8">
                                                    <AvatarImage src={reply.user?.image} />
                                                    <AvatarFallback>{reply.user?.name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-xs">{reply.user?.name}</span>
                                                            <span className="text-[10px] text-gray-500">
                                                                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                        {session?.user?.id === reply.userId && (
                                                            <button 
                                                                onClick={() => handleDelete(reply.id)}
                                                                className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover/reply:opacity-100"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-700 dark:text-gray-300 text-sm">{reply.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
