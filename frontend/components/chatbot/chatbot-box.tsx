"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";

import { chatApi } from "@/lib/api";
import { ChatbotMessages, type ChatMessage } from "./chatbot-messages";

interface ChatbotBoxProps {
  title?: string;
  subtitle?: string;
  /**
   * Hàm gửi tin nhắn và nhận câu trả lời. Mặc định gọi chatApi.complete
   * (đã có sẵn trong @/lib/api, dùng chung helper request<T> như usersApi/importDetailsApi).
   * Có thể truyền hàm khác vào nếu muốn tuỳ biến, ví dụ để test với dữ liệu giả.
   */
  onSendMessage?: (message: string, history: ChatMessage[]) => Promise<string>;
}

/**
 * Icon chat nổi góc phải dưới + panel nhắn tin khi mở.
 */
export function ChatbotBox({
  title = "Trợ lý nội bộ",
  subtitle = "Hỏi về KPI, đơn hàng, công nợ...",
  onSendMessage,
}: ChatbotBoxProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const sendFn = onSendMessage ?? chatApi.complete;
      const answer = await sendFn(trimmed, nextMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Xin lỗi, có lỗi xảy ra khi xử lý câu hỏi. Vui lòng thử lại." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <>
      {/* Panel chat */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] transition-all duration-200 origin-bottom-right ${
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-2 pointer-events-none"
        }`}
      >
        <div className="flex flex-col h-[520px] max-h-[70vh] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Bot className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{title}</p>
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto h-7 w-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              aria-label="Đóng chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <ChatbotMessages messages={messages} loading={loading} />

          {/* Input */}
          <div className="border-t border-slate-100 p-3">
            <div className="flex items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 focus-within:border-blue-400 focus-within:bg-white transition-colors px-3 py-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-slate-400 max-h-24"
              />
              <button
                onClick={() => void handleSend()}
                disabled={!input.trim() || loading}
                className="h-7 w-7 shrink-0 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                aria-label="Gửi tin nhắn"
              >
                <Send className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nút nổi góc phải dưới */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label={open ? "Đóng chatbot" : "Mở chatbot"}
      >
        {open ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
      </button>
    </>
  );
}