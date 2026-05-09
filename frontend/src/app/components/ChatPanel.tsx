import { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import { Button } from "./ui/Button";
import { Markdown } from "./Markdown";
import { chatApi } from "../lib/api";
import { useMealPlan } from "../lib/mealPlanStore";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface ChatPanelProps {
  onClose: () => void;
  hasMealPlan?: boolean;
}

export function ChatPanel({ onClose, hasMealPlan = false }: ChatPanelProps) {
  const { mealPlan, setMealPlan } = useMealPlan();
  const mode = hasMealPlan ? "REFINE_MENU" : "ASK_QUESTION";

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: hasMealPlan
        ? 'Halo! Mau ubah apa dari meal plan kamu? Contoh: "ganti ayam jadi tempe untuk semua hari".'
        : "Hai, kamu bisa tanya seputar gizi & nutrisi di sini. Setelah generate meal plan, chat ini otomatis jadi mode refine.",
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: message }]);
    setBusy(true);
    try {
      const res = await chatApi.send(message, mealPlan?.meal_plan_id ?? null);
      setMessages((m) => [...m, { role: "assistant", text: res.reply }]);
      if (res.intent === "REFINE_MENU" && res.updated_meal_plan) {
        setMealPlan(res.updated_meal_plan);
      }
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `Gagal: ${err.message ?? "error"}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="w-[380px] shrink-0 bg-white border-l border-[var(--mbg-border)] flex flex-col h-full">
      <div className="h-14 px-4 flex items-center justify-between border-b border-[var(--mbg-border)]">
        <div className="flex flex-col">
          <span className="text-sm" style={{ fontWeight: 600 }}>Chat</span>
          <span className="text-xs text-[var(--mbg-muted)]">
            Mode: {mode === "REFINE_MENU" ? "Refine meal plan" : "Tanya gizi"}
          </span>
        </div>
        <button
          onClick={onClose}
          className="size-8 rounded-md hover:bg-[var(--mbg-bg)] flex items-center justify-center text-[var(--mbg-muted)]"
          aria-label="Tutup chat"
        >
          <X size={16} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
              m.role === "user"
                ? "self-end bg-[var(--mbg-primary)] text-white rounded-tr-sm whitespace-pre-wrap"
                : "self-start bg-[var(--mbg-bg)] text-[var(--mbg-dark)] rounded-tl-sm"
            }`}
          >
            {m.role === "assistant" ? <Markdown text={m.text} /> : m.text}
          </div>
        ))}
        {busy && (
          <div className="self-start bg-[var(--mbg-bg)] rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-[var(--mbg-muted)] flex items-center gap-2">
            <span className="flex gap-1">
              <span className="size-1.5 rounded-full bg-[var(--mbg-muted)] animate-bounce [animation-delay:-0.3s]" />
              <span className="size-1.5 rounded-full bg-[var(--mbg-muted)] animate-bounce [animation-delay:-0.15s]" />
              <span className="size-1.5 rounded-full bg-[var(--mbg-muted)] animate-bounce" />
            </span>
            AI is typing...
          </div>
        )}
      </div>

      <form
        onSubmit={send}
        className="p-3 border-t border-[var(--mbg-border)] flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            hasMealPlan ? "Tulis instruksi perubahan..." : "Tanya seputar gizi..."
          }
          className="flex-1 h-10 px-3 rounded-lg bg-[var(--mbg-bg)] outline-none text-sm focus:ring-2 focus:ring-[var(--mbg-primary)]/20"
        />
        <Button type="submit" size="md" aria-label="Kirim" disabled={busy}>
          <Send size={16} />
        </Button>
      </form>
    </aside>
  );
}
