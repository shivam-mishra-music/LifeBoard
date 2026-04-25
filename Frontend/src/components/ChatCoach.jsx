"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";

function MessageBubble({ message, isUser }) {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
          isUser
            ? "bg-indigo-600 text-white rounded-br-none"
            : "bg-slate-700 text-slate-100 rounded-bl-none"
        }`}
      >
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-1 mb-3">
      <div className="w-2 h-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: "0ms" }} />
      <div className="w-2 h-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: "150ms" }} />
      <div className="w-2 h-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

export default function ChatCoach({ token, userName }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    if (!token) return;
    loadHistory();
  }, [token]);

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/chat/history?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.messages) {
        setMessages(res.data.messages);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setHistoryLoaded(true);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    
    // Add user message to UI immediately
    setMessages(prev => [...prev, { content: userMessage, role: "user" }]);
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_URL}/api/chat/send`,
        { message: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.message) {
        setMessages(prev => [...prev, { content: res.data.message, role: "assistant" }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev,
        { content: "Sorry, I couldn't process that. Try again!", role: "assistant" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-[#0c1220] to-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600/20 to-indigo-500/10 border-b border-indigo-500/10 px-6 py-4">
        <h1 className="text-2xl font-bold text-white">✨ Chat with AI Coach</h1>
        <p className="text-sm text-slate-400 mt-1">Your personal life advisor</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4">
        {!historyLoaded ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-400">Loading conversation...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="text-5xl mb-4">✨</div>
              <h2 className="text-xl font-semibold text-white mb-2">Start Your Conversation</h2>
              <p className="text-slate-400 mb-6">
                Ask me about your tasks, habits, mood, productivity, or anything related to your personal growth!
              </p>
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Try asking:</p>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => {
                      setInput("What should I focus on today?");
                    }}
                    className="text-left px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-300 text-sm transition-all"
                  >
                    "What should I focus on today?"
                  </button>
                  <button
                    onClick={() => {
                      setInput("How can I improve my productivity?");
                    }}
                    className="text-left px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-300 text-sm transition-all"
                  >
                    "How can I improve my productivity?"
                  </button>
                  <button
                    onClick={() => {
                      setInput("Give me motivation for today");
                    }}
                    className="text-left px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-300 text-sm transition-all"
                  >
                    "Give me motivation for today"
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg.content} isUser={msg.role === "user"} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-700/50 bg-[#0c1220] px-4 md:px-6 py-4 space-y-3">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Shift+Enter for new line)"
            rows={1}
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/30 resize-none"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>→</span>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-600 text-center">
          💬 This coach has access to your tasks, habits, and mood data to give personalized advice
        </p>
      </div>
    </div>
  );
}