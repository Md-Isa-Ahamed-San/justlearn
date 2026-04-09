import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Copy} from "lucide-react";

export const CopyButton = ({ text, className = "" }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            className={`h-5 w-5 p-0 rounded-md ${className}`}
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy course code"}
        >
            <Copy className={`h-3 w-3 ${copied ? 'text-green-600' : 'text-gray-500'}`} />
        </Button>
    );
};