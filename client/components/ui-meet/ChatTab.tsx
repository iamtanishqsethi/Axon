"use client";

import {useMeetingStore} from "@/store/meetingStore";
import {useRoomContext} from "@livekit/components-react";
import {useEffect, useRef, useState} from "react";
import {socket} from "@/lib/socket";
import {ChatMessage} from "@/types/store.types";
import {Button} from "@/components/ui/button";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Input} from "@/components/ui/input";
import {Send, MessageCircle, Smile} from "lucide-react";
import {cn} from "@/lib/utils";
import {playMeetingSound} from "@/lib/meeting-sounds";
import GlassSurface from "@/components/GlassSurface";

interface ChatTabProps {
    meetingId: string;
}

export default function ChatTab({meetingId}: ChatTabProps) {
    const messages = useMeetingStore(store => store.chatMessages);
    const addMessage = useMeetingStore(store => store.setChatMessages);
    const room = useRoomContext();
    const [text, setText] = useState("");
    const messageEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({behavior: "smooth", block: "end"});
    }, [messages.length]);

    function sendMessage(e?: React.FormEvent) {
        e?.preventDefault();
        const trimmed = text.trim();
        if (!trimmed) return;

        const currentUserId = room.localParticipant?.identity || socket.id || "unknown";

        const msg: ChatMessage = {
            id: `${currentUserId}-${Date.now()}`,
            text: trimmed,
            userId: currentUserId,
            userName: room.localParticipant?.name || room.localParticipant?.identity || "You",
            timestamp: Date.now(),
        };

        socket.emit("chat-message", {meetingId, ...msg});
        addMessage(msg);
        playMeetingSound("sent");
        setText("");
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
                <MessageCircle size={16} className="text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground/90">Chat</span>
            </div>

            <ScrollArea className="min-h-0 flex-1">
                <div className="flex flex-col gap-4 p-4">
                    {messages.length === 0 && (
                        <div className="mt-16 flex flex-col items-center gap-3 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                                <Send size={18} className="text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
                                <p className="text-xs text-muted-foreground/60">Say hello to start the conversation</p>
                            </div>
                        </div>
                    )}

                    {messages.map((m, i) => {
                        const isSelf = m.userId === room.localParticipant?.identity || m.userId === socket.id;
                        const sender = m.userName ?? (isSelf ? "You" : m.userId.slice(0, 8));

                        return (
                            <div
                                key={m.id ?? `${m.userId}-${m.timestamp}-${i}`}
                                className={cn("group flex flex-col gap-1", isSelf ? "items-end" : "items-start")}
                            >
                                <div className={cn("flex items-center gap-2", isSelf && "flex-row-reverse")}>
                                    <span className="text-[11px] font-semibold text-muted-foreground/80 dark:text-white/50">{sender}</span>
                                    <span className="text-[10px] text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 dark:text-white/30">
                                        {new Date(m.timestamp ?? 0).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                                <div className={cn("flex items-end gap-2 max-w-[85%]", isSelf && "flex-row-reverse")}>
                                    <div
                                        className={cn(
                                            "rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
                                            isSelf
                                                ? "bg-primary text-primary-foreground rounded-br-md shadow-md"
                                                : "bg-muted text-foreground/90 rounded-bl-md"
                                        )}
                                    >
                                        {m.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messageEndRef} />
                </div>
            </ScrollArea>

            <form onSubmit={sendMessage} className="relative flex border-t border-border/50 p-3">
                <div className="relative flex w-full items-center group">
                    <GlassSurface
                        borderRadius={999}
                        width="100%"
                        height={44}
                        backgroundOpacity={0.05}
                        blur={20}
                        className="transition-all duration-300 group-focus-within:background-opacity-10 group-focus-within:border-border/50 dark:group-focus-within:border-white/20"
                        contentClassName="p-0"
                    >
                        <div className="relative w-full h-full flex items-center pr-1">
                            <Input
                                value={text}
                                onChange={e => setText(e.target.value)}
                                placeholder="Type a message..."
                                className="min-w-0 flex-1 bg-transparent border-none text-[13px] font-medium text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 h-full dark:text-foreground/90"
                                aria-label="Chat message"
                            />
                            <Button
                                variant={'secondary'}
                                type="submit"
                                size="icon"
                                disabled={!text.trim()}
                                className={cn(
                                    "absolute right-1 size-8 rounded-full transition-all duration-300",
                                    text.trim() 
                                    ? "bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95" 
                                    : "bg-muted text-muted-foreground/30"
                                )}
                                aria-label="Send message"
                            >
                                <Send size={14} />
                            </Button>
                        </div>
                    </GlassSurface>
                </div>
            </form>

        </div>
    );
}
