import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  TrendingUp,
  Receipt,
  DollarSign,
  Calendar,
  FileText,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
} from "lucide-react";

// Mock AI response function (replace with actual Gemini API call)
const generateAIResponse = async (
  userMessage: string,
  conversationHistory: any[]
) => {
  // Simulate API delay
  await new Promise((resolve) =>
    setTimeout(resolve, 1000 + Math.random() * 1000)
  );

  const msg = userMessage.toLowerCase();

  // Intelligent response system based on keywords
  if (
    msg.includes("submit") ||
    msg.includes("create") ||
    msg.includes("add expense")
  ) {
    return {
      text: "I can help you submit an expense! Here's what you need:\n\n**Required Information:**\n• Expense amount and currency\n• Date of expense\n• Category (Travel, Meals, Office Supplies, etc.)\n• Merchant/vendor name\n• Receipt image or document\n\n**Quick Tips:**\n✓ Expenses over $500 require manager approval\n✓ Submit within 30 days for faster processing\n✓ Clear receipt photos speed up approval\n\nWould you like me to guide you through the submission process?",
      suggestions: [
        "Start expense submission",
        "View expense categories",
        "Check policy limits",
      ],
    };
  }

  if (
    msg.includes("approve") ||
    msg.includes("approval") ||
    msg.includes("pending")
  ) {
    return {
      text: "Let me help you understand the approval workflow:\n\n**Approval Process:**\n1️⃣ **Manager Review** (1-2 business days)\n   • Validates business purpose\n   • Checks policy compliance\n\n2️⃣ **Finance Approval** (2-3 business days)\n   • Verifies documentation\n   • Processes reimbursement\n\n**Current Status Check:**\nYou have **3 pending expenses** totaling $1,247.50\n• 2 awaiting manager approval\n• 1 in finance review\n\nExpected processing: 3-5 business days",
      suggestions: [
        "View pending expenses",
        "Contact approver",
        "Approval policy",
      ],
    };
  }

  if (
    msg.includes("policy") ||
    msg.includes("limit") ||
    msg.includes("rules")
  ) {
    return {
      text: "Here's your expense policy overview:\n\n**Spending Limits:**\n• Meals: $75/day domestic, $100/day international\n• Hotels: $250/night (varies by city tier)\n• Flights: Economy class for trips under 6 hours\n• Ground Transport: Reasonable rideshare/taxi costs\n\n**Important Policies:**\n⚠️ Alcohol requires business justification\n⚠️ Personal expenses are not reimbursable\n✓ Tips up to 20% are allowed\n✓ Internet/wifi during travel is covered\n\nNeed details on a specific category?",
      suggestions: [
        "Travel policy details",
        "Meal guidelines",
        "Receipt requirements",
      ],
    };
  }

  if (
    msg.includes("report") ||
    msg.includes("analytics") ||
    msg.includes("spending")
  ) {
    return {
      text: "**Your Spending Analytics (Last 30 Days)**\n\n📊 **Total Expenses:** $3,842.67\n📈 **Trend:** ↑ 12% vs. previous month\n\n**Top Categories:**\n1. Travel: $1,450.00 (38%)\n2. Meals: $985.50 (26%)\n3. Office Supplies: $687.17 (18%)\n4. Other: $720.00 (18%)\n\n**Insights:**\n• You're within budget for all categories\n• Average approval time: 2.3 days\n• 95% approval rate\n\nWould you like a detailed PDF report?",
      suggestions: ["Download report", "View by category", "Compare quarters"],
    };
  }

  if (
    msg.includes("receipt") ||
    msg.includes("upload") ||
    msg.includes("document")
  ) {
    return {
      text: "**Receipt & Documentation Guide**\n\n✅ **Accepted Formats:**\n• Images: JPG, PNG, HEIC (max 10MB)\n• Documents: PDF (max 15MB)\n• Email receipts: Forward to expenses@company.com\n\n**Best Practices:**\n• Ensure all details are clearly visible\n• Include itemized receipts for meals over $25\n• Capture full document (no cropping important info)\n• For lost receipts, file a missing receipt affidavit\n\n📱 **Pro Tip:** Use the mobile app to scan receipts with auto-detection of amount, date, and merchant!",
      suggestions: [
        "Upload receipt now",
        "Missing receipt form",
        "Mobile app guide",
      ],
    };
  }

  if (
    msg.includes("reimburse") ||
    msg.includes("payment") ||
    (msg.includes("when") && msg.includes("paid"))
  ) {
    return {
      text: "**Reimbursement Information**\n\n💰 **Payment Schedule:**\n• Approved expenses are paid bi-weekly\n• Next payment date: **Friday, October 11, 2025**\n• Direct deposit typically arrives within 2 business days\n\n**Your Reimbursement Status:**\n✓ $847.50 approved - scheduled for Oct 11\n⏳ $1,247.50 pending approval\n📝 $0 requires action from you\n\n**Total Due to You:** $2,095.00\n\nVerify your bank details are current to avoid delays!",
      suggestions: [
        "Update bank info",
        "View payment history",
        "Download statements",
      ],
    };
  }

  if (msg.includes("help") || msg.includes("how") || msg.includes("what")) {
    return {
      text: "I'm your intelligent expense assistant! I can help you with:\n\n**💼 Expense Management:**\n• Submit and track expenses\n• Upload receipts and documentation\n• Check approval status\n\n**📋 Policy & Compliance:**\n• Explain company expense policies\n• Verify spending limits\n• Provide category guidelines\n\n**📊 Analytics & Reports:**\n• View spending trends\n• Generate expense reports\n• Track budget utilization\n\n**💬 Smart Assistance:**\n• Answer questions 24/7\n• Provide real-time notifications\n• Offer proactive suggestions\n\nWhat would you like to explore?",
      suggestions: [
        "Submit expense",
        "Check status",
        "View analytics",
        "Policy questions",
      ],
    };
  }

  // Default intelligent response
  return {
    text:
      "I understand you're asking about: \"" +
      userMessage +
      "\"\n\nI'm here to help with your expense management needs! Could you provide more details about:\n\n• Are you trying to submit a new expense?\n• Need information about a pending expense?\n• Have questions about company policy?\n• Looking for spending analytics?\n\nThe more specific you are, the better I can assist you!",
    suggestions: [
      "Submit expense",
      "Check approvals",
      "View policies",
      "Get analytics",
    ],
  };
};

type Message = {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 **Welcome to your Intelligent Expense Assistant!**\n\nI'm here to help you manage expenses efficiently. I can:\n✓ Guide you through expense submissions\n✓ Track approval status in real-time\n✓ Answer policy questions instantly\n✓ Provide spending insights\n\nHow can I assist you today?",
      suggestions: [
        "Submit new expense",
        "Check pending approvals",
        "View spending analytics",
        "Explain policies",
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (messageText?: string) => {
    const userMessage = messageText || input.trim();
    if (!userMessage || isLoading) return;

    setInput("");
    setShowQuickActions(false);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await generateAIResponse(userMessage, messages);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.text,
          suggestions: response.suggestions,
        },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ I apologize, but I'm experiencing technical difficulties. Please try again in a moment, or contact support if the issue persists.",
          suggestions: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    { icon: Receipt, label: "Submit Expense", color: "bg-blue-500" },
    { icon: Clock, label: "Check Status", color: "bg-purple-500" },
    { icon: BarChart3, label: "View Analytics", color: "bg-green-500" },
    { icon: FileText, label: "Expense Policies", color: "bg-orange-500" },
  ];

  const formatMessage = (content: string) => {
    // Split by bold markers and format
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      {/* Floating Chat Button with Notification Badge */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-50 group"
        >
          <MessageCircle className="w-7 h-7" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
            3
          </div>
          <div className="absolute inset-0 rounded-full bg-blue-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
        </button>
      )}

      {/* Enhanced Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[440px] h-[700px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden">
          {/* Premium Header with Gradient */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white p-5 flex items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Expense Assistant</h3>
                <p className="text-xs text-blue-100 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  AI-Powered • Always Available
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded-lg p-2 transition-all relative z-10 hover:rotate-90 duration-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions Bar */}
          {showQuickActions && messages.length <= 1 && (
            <div className="p-4 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-2">
                <Zap className="w-3 h-3" />
                QUICK ACTIONS
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(action.label)}
                    className="flex items-center gap-2 p-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all hover:shadow-md group"
                  >
                    <div
                      className={`${action.color} w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <action.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Area with Enhanced Styling */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-gray-50">
            {messages.map((message, index) => (
              <div key={index} className="animate-fadeIn">
                <div
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
                        : "bg-white text-gray-800 border border-gray-100"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {formatMessage(message.content)}
                    </p>
                  </div>
                </div>

                {/* Suggestion Chips */}
                {message.role === "assistant" && message.suggestions && (
                  <div className="flex flex-wrap gap-2 mt-3 ml-2">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(suggestion)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-full border border-blue-200 transition-all hover:shadow-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Enhanced Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      AI is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about expenses..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl transition-all shadow-sm hover:shadow-md disabled:shadow-none group"
              >
                <Send className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Powered by AI • Secure & Confidential
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Chatbot;
