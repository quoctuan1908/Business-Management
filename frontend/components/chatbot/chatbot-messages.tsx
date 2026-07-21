"use client";

import { useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Style riêng cho từng thẻ markdown, khớp theme xanh dương/slate hiện có.
 * Không phụ thuộc @tailwindcss/typography — chỉ dùng Tailwind core classes.
 */
const markdownComponents = {
  p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc pl-4 mb-2 space-y-0.5 last:mb-0">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-4 mb-2 space-y-0.5 last:mb-0">{children}</ol>,
  li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }: any) => <strong className="font-bold text-slate-900">{children}</strong>,
  code: ({ children }: any) => (
    <code className="bg-slate-100 text-slate-800 rounded px-1 py-0.5 text-[13px]">{children}</code>
  ),
  a: ({ children, href }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline underline-offset-2">
      {children}
    </a>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto mb-2 last:mb-0 rounded-lg border border-slate-200">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-blue-50">{children}</thead>,
  th: ({ children }: any) => (
    <th className="text-left font-semibold text-slate-700 px-2.5 py-1.5 border-b border-slate-200">{children}</th>
  ),
  td: ({ children }: any) => <td className="px-2.5 py-1.5 border-b border-slate-100 text-slate-700">{children}</td>,
};

interface ChatbotMessagesProps {
  messages: ChatMessage[];
  loading: boolean;
}

/**
 * Danh sách tin nhắn trong chatbot, tự cuộn xuống cuối khi có tin mới.
 */
export function ChatbotMessages({ messages, loading }: ChatbotMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.length === 0 && !loading && (
        <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-10">
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Bot className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-sm font-medium text-slate-700">Chào bạn 👋</p>
          <p className="text-xs text-muted-foreground max-w-[220px]">
            Hỏi mình về KPI, đơn hàng, công nợ khách hàng... mình sẽ tra cứu giúp bạn.
          </p>
        </div>
      )}

      {messages.map((msg, idx) => {
        const isUser = msg.role === "user";
        return (
          <div
            key={idx}
            className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
          >
            {!isUser && (
              <div className="h-6 w-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Bot className="h-3.5 w-3.5 text-blue-500" />
              </div>
            )}

            <div
              className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words ${
                isUser
                  ? "bg-blue-600 text-white rounded-br-md whitespace-pre-wrap"
                  : "bg-slate-50 text-slate-800 border border-slate-100 rounded-bl-md"
              }`}
            >
              {isUser ? (
                msg.content
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>

            {isUser && (
              <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <User className="h-3.5 w-3.5 text-slate-500" />
              </div>
            )}
          </div>
        );
      })}

      {loading && (
        <div className="flex items-end gap-2 justify-start">
          <div className="h-6 w-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Bot className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}