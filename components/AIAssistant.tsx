import React, { useState, useRef, useEffect } from 'react';
import { askAIAboutData } from '../services/geminiService';
import { Bot, Send, Sparkles, X } from 'lucide-react';
import { DataItem } from '../types';

interface AIAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    data: DataItem[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, data }) => {
    const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            if (!data || data.length === 0) {
                 setMessages(prev => [...prev, { role: 'ai', text: "I don't see any data loaded yet. Please upload a CSV file or load the sample data so I can answer your questions." }]);
            } else {
                const response = await askAIAboutData(data, userMsg);
                setMessages(prev => [...prev, { role: 'ai', text: response }]);
            }
        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble analyzing the data right now. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col animate-slide-in-right font-sans h-full">
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2 text-blue-700">
                    <Bot className="h-5 w-5" />
                    <h2 className="font-semibold">Copilot</h2>
                </div>
                <button onClick={onClose} className="hover:bg-gray-100 rounded p-1 transition-colors text-gray-500">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-center">
                        <Sparkles className="mb-2 h-8 w-8 text-blue-300" />
                        <p className="text-sm max-w-[200px]">I can help you interpret your dashboard metrics and suggest optimizations.</p>
                        <p className="text-xs mt-2 text-gray-300">Try asking: "What is the total revenue?" or "Which car model sold the most?"</p>
                    </div>
                )}

                <div className="space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                     {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 rounded-bl-none shadow-sm flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
                    <input 
                        type="text" 
                        className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-500"
                        placeholder="Ask a question..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;