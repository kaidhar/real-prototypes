"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm your AI assistant. I can help you with account insights, competitor analysis, and outreach suggestions. What would you like to know about this account?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Based on the account data, Coatcom Limited shows strong potential for your ICP. Their intent score is HIGH-0, indicating active interest in solutions like yours.",
        "I found that this account has 1 contact: Francois Deventer. Would you like me to help draft a personalized outreach message?",
        "Looking at the signals data, I recommend enriching this account to get more insights on their technology stack and buying intent.",
        "This account was added by Goutham Joshi. I can help you prepare talking points based on their industry and company profile.",
      ];

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const quickActions = [
    "Summarize this account",
    "Draft outreach email",
    "Find competitors",
    "Suggest next steps",
  ];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: "#1c64f2" }}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:opacity-90 transition-all z-50"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          style={{ backgroundColor: "#ffffff", borderColor: "#e7e7e6" }}
          className="fixed bottom-6 right-6 w-[400px] h-[600px] rounded-2xl shadow-2xl border flex flex-col z-50 overflow-hidden"
        >
          {/* Header */}
          <div
            style={{ backgroundColor: "#0e2933" }}
            className="px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                style={{ backgroundColor: "#1c64f2" }}
                className="w-10 h-10 rounded-full flex items-center justify-center"
              >
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Sprouts AI Assistant</h3>
                <p style={{ color: "#6e7f85" }} className="text-xs">
                  Always here to help
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ color: "#6e7f85" }}
              className="hover:opacity-80"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  style={{
                    backgroundColor: message.role === "assistant" ? "#ebf5ff" : "#1c64f2",
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  {message.role === "assistant" ? (
                    <Bot size={16} style={{ color: "#1c64f2" }} />
                  ) : (
                    <User size={16} className="text-white" />
                  )}
                </div>
                <div
                  style={{
                    backgroundColor: message.role === "assistant" ? "#f9fafb" : "#1c64f2",
                    color: message.role === "assistant" ? "#191918" : "#ffffff",
                  }}
                  className={`max-w-[280px] px-4 py-3 rounded-2xl text-sm ${
                    message.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div
                  style={{ backgroundColor: "#ebf5ff" }}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <Bot size={16} style={{ color: "#1c64f2" }} />
                </div>
                <div
                  style={{ backgroundColor: "#f9fafb" }}
                  className="px-4 py-3 rounded-2xl rounded-tl-sm"
                >
                  <div className="flex gap-1">
                    <span
                      style={{ backgroundColor: "#6b7280" }}
                      className="w-2 h-2 rounded-full animate-bounce"
                    />
                    <span
                      style={{ backgroundColor: "#6b7280", animationDelay: "0.1s" }}
                      className="w-2 h-2 rounded-full animate-bounce"
                    />
                    <span
                      style={{ backgroundColor: "#6b7280", animationDelay: "0.2s" }}
                      className="w-2 h-2 rounded-full animate-bounce"
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div
            style={{ borderColor: "#e7e7e6" }}
            className="px-4 py-2 border-t flex gap-2 overflow-x-auto"
          >
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => setInput(action)}
                style={{ borderColor: "#e7e7e6", color: "#6b7280" }}
                className="px-3 py-1.5 text-xs border rounded-full whitespace-nowrap hover:opacity-80 flex items-center gap-1"
              >
                <Sparkles size={12} style={{ color: "#1c64f2" }} />
                {action}
              </button>
            ))}
          </div>

          {/* Input */}
          <div
            style={{ borderColor: "#e7e7e6" }}
            className="p-4 border-t"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about this account..."
                style={{ borderColor: "#e7e7e6", color: "#191918" }}
                className="flex-1 px-4 py-2.5 text-sm border rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                style={{ backgroundColor: input.trim() ? "#1c64f2" : "#e5e7eb" }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
