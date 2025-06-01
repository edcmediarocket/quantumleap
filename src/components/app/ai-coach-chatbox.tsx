
// src/components/app/ai-coach-chatbox.tsx
"use client";

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingDots } from '@/components/ui/loading-dots';
import { Bot, User, Send, Brain, Sparkles, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCardRoot } from './glass-card';
import { aiCoachChat, type AiCoachChatInput, type AiCoachChatOutput, type Message as AIMessage } from '@/ai/flows/ai-coach-chat';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { getAuth, User as FirebaseUser } from 'firebase/auth'; // Import FirebaseUser
import { firebaseConfig } from '@/lib/firebaseConfig';
import { initializeApp, getApps } from 'firebase/app';
import type { ActiveTabType } from '@/app/page';

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}
const auth = getAuth(app);


const functionsBaseUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL; // For logging

interface AiCoachChatboxProps {
  className?: string;
  logAiInteraction: (userPrompt: string, aiResult: any, flowName: string) => Promise<void>;
  activeTab: ActiveTabType;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model'; // 'model' for AI
  content: string;
  timestamp: Date;
}

export function AiCoachChatbox({ className, logAiInteraction, activeTab }: AiCoachChatboxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const userMessageContent = inputValue.trim();
    if (!userMessageContent) return;

    const newUserMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      role: 'user',
      content: userMessageContent,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    const chatHistoryForFlow: AIMessage[] = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const inputForFlow: AiCoachChatInput = {
        userMessage: userMessageContent,
        chatHistory: chatHistoryForFlow,
        userName: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Trader',
      };
      const result: AiCoachChatOutput = await aiCoachChat(inputForFlow);
      
      const aiResponseMessage: ChatMessage = {
        id: Date.now().toString() + '-model',
        role: 'model',
        content: result.aiResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponseMessage]);
      await logAiInteraction(userMessageContent, {aiResponse: result.aiResponse, chatHistorySent: chatHistoryForFlow}, "AiCoachChat");

    } catch (err) {
      console.error("Error in AI Coach Chat:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred with the AI Coach.";
      setError(errorMessage);
      toast({
        title: "AI Coach Error",
        description: errorMessage,
        variant: "destructive",
      });
       const errorResponseMessage: ChatMessage = {
        id: Date.now().toString() + '-error',
        role: 'model',
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponseMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const cardGlowClass = 
    activeTab === 'profitGoal' ? 'default-glow-accent' :
    activeTab === 'memeFlip' ? 'default-glow-orange' :
    'default-glow-primary';

  const headerIconColor =
    activeTab === 'profitGoal' ? 'text-accent' :
    activeTab === 'memeFlip' ? 'text-[hsl(var(--orange-hsl))]' :
    'text-primary';
  
  const headerTitleColor = 
    activeTab === 'profitGoal' ? 'text-accent-foreground' : // Assuming accent-foreground for blue themes
    activeTab === 'memeFlip' ? 'text-white' : // On orange, white text might be better
    'text-primary-foreground'; // Default

  const aiMessageBubbleClasses = 
    activeTab === 'profitGoal' ? 'bg-accent/10 text-accent-foreground border-accent/20' :
    activeTab === 'memeFlip' ? 'bg-orange-500/10 text-foreground border-orange-500/20' :
    'bg-primary/10 text-primary-foreground border-primary/20';

  const userMessageBubbleClasses =
    activeTab === 'profitGoal' ? 'bg-blue-500/20 text-blue-100 border-blue-500/30 rounded-br-none' : // Custom user bubble for accent
    activeTab === 'memeFlip' ? 'bg-red-500/20 text-red-100 border-red-500/30 rounded-br-none' : // Custom user bubble for orange
    'bg-accent/20 text-accent-foreground border-accent/30 rounded-br-none'; // Default user bubble (current uses accent)

  const sendButtonClasses =
    activeTab === 'profitGoal' ? 'bg-accent hover:bg-accent/90' :
    activeTab === 'memeFlip' ? 'bg-[hsl(var(--orange-hsl))] hover:bg-[hsl(var(--orange-hsl))]/90 text-white' :
    'bg-primary hover:bg-primary/90';
  
  const botIconColor = headerIconColor; // Match bot icon to header icon color for consistency

  return (
    <GlassCardRoot className={cn("glass-effect w-full max-w-2xl mx-auto p-0 flex flex-col", cardGlowClass, className)} style={{height: '70vh'}}>
      <header className="p-4 border-b border-border/30 flex items-center gap-3">
        <Brain className={cn("h-7 w-7", headerIconColor)} />
        <h2 className={cn("text-xl font-semibold", headerTitleColor)}>Quantum AI Coach Chat</h2>
      </header>
      
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-end gap-2 max-w-[85%]",
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              )}
            >
              {msg.role === 'model' && <Bot className={cn("h-7 w-7 shrink-0 mb-1", botIconColor)} />}
              {msg.role === 'user' && <User className={cn("h-7 w-7 shrink-0 mb-1", userMessageBubbleClasses.includes('accent') || userMessageBubbleClasses.includes('blue') ? 'text-accent' : userMessageBubbleClasses.includes('red') ? 'text-red-400' : 'text-accent')} />}
              <div
                className={cn(
                  "p-3 rounded-xl text-sm shadow-md min-w-[80px]",
                  msg.role === 'user' 
                    ? cn(userMessageBubbleClasses) 
                    : cn(aiMessageBubbleClasses, 'rounded-bl-none')
                )}
              >
                <ReactMarkdown
                  components={{
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                    strong: ({node, ...props}) => <strong className={cn("font-semibold", activeTab === 'memeFlip' ? 'text-orange-300' : activeTab === 'profitGoal' ? 'text-blue-300' : 'text-purple-300')} {...props} />,
                    em: ({node, ...props}) => <em className="italic" {...props} />,
                    code: ({node, inline, className: mdClassName, children, ...props}) => {
                        const match = /language-(\w+)/.exec(mdClassName || '')
                        return !inline && match ? (
                        <pre className="my-2 bg-background/50 p-2 rounded-md overflow-x-auto text-xs border border-border/30"><code className={mdClassName} {...props}>{children}</code></pre>
                        ) : (
                        <code className={cn("bg-muted px-1 py-0.5 rounded text-xs", activeTab === 'memeFlip' ? 'text-amber-400' : activeTab === 'profitGoal' ? 'text-sky-400' : 'text-fuchsia-400')} {...props}>{children}</code>
                        )
                    }
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
                <p className={cn("text-[10px] mt-1.5 opacity-60", msg.role === 'user' ? 'text-right' : 'text-left')}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 max-w-[85%] mr-auto">
              <Bot className={cn("h-7 w-7 shrink-0 mb-1", botIconColor)} />
              <div className={cn("p-3 rounded-xl text-sm shadow-md rounded-bl-none", aiMessageBubbleClasses)}>
                <LoadingDots size="sm" />
              </div>
            </div>
          )}
          {error && !isLoading && (
             <Alert variant="destructive" className="my-2">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Chat Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border/30 flex items-center gap-3 bg-background/50">
        <Textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask Quantum anything about crypto trading..."
          className={cn(
            "flex-grow resize-none min-h-[40px] max-h-[120px] text-sm rounded-lg",
            activeTab === 'profitGoal' && 'focus-visible:ring-accent/80',
            activeTab === 'memeFlip' && 'focus-visible:ring-orange-500/80',
            activeTab === 'aiPicks' && 'focus-visible:ring-primary/80'
          )}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          rows={1}
        />
        <Button type="submit" disabled={isLoading || !inputValue.trim()} className={cn("h-10 px-4", sendButtonClasses)}>
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </GlassCardRoot>
  );
}

    
