"use client";

import {useParticipants} from "@livekit/components-react";
import {useMeetingStore} from "@/store/meetingStore";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Check, Crown, Hand, Mic, MicOff, MoreHorizontal, Search, UserMinus, Video, VideoOff, X} from "lucide-react";
import {useCallback, useEffect, useMemo, useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {socket} from "@/lib/socket";
import {approveParticipant, getWaitingRoom, rejectParticipant} from "@/services/api";
import {toast} from "sonner";
import {cn} from "@/lib/utils";
import GlassSurface from "@/components/GlassSurface";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ParticipantsTabProps {
    meetingId: string;
}

interface WaitingParticipant {
    id: string;
    user: {
        id: string;
        firstName: string;
        lastName?: string;
        imageUrl?: string;
    };
}

function initials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2)).toUpperCase();
}

export default function ParticipantsTab({meetingId}: ParticipantsTabProps) {
    const participants = useParticipants();
    const [waitingRoomParticipants, setWaitingRoomParticipants] = useState<WaitingParticipant[]>([]);
    const [query, setQuery] = useState("");
    const isHost = useMeetingStore(state => state.isHost);
    const setWaitingRoomCount = useMeetingStore(state => state.setWaitingRoomCount);

    const fetchWaitingRoom = useCallback(async () => {
        try {
            const data = await getWaitingRoom(meetingId);
            setWaitingRoomParticipants(data);
            setWaitingRoomCount(data.length);
        } catch (error) {
            console.error("Error fetching waiting room:", error);
        }
    }, [meetingId, setWaitingRoomCount]);

    useEffect(() => {
        if (!isHost) return;
        queueMicrotask(() => void fetchWaitingRoom());

        const handleWaitingUser = () => {
            void fetchWaitingRoom();
        };

        socket.on("new-waiting-user", handleWaitingUser);
        return () => {
            socket.off("new-waiting-user", handleWaitingUser);
        };
    }, [fetchWaitingRoom, isHost]);

    const handleApprove = async (participantId: string) => {
        try {
            await approveParticipant(meetingId, participantId);
            socket.emit("approve-user", {meetingId, participantId});
            toast.success("Participant approved");
            setWaitingRoomParticipants(prev => {
                const newList = prev.filter(p => p.id !== participantId);
                setWaitingRoomCount(newList.length);
                return newList;
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to approve participant");
        }
    };

    const handleReject = async (participantId: string) => {
        try {
            await rejectParticipant(meetingId, participantId);
            socket.emit("reject-user", {meetingId, participantId});
            toast.success("Participant rejected");
            setWaitingRoomParticipants(prev => {
                const newList = prev.filter(p => p.id !== participantId);
                setWaitingRoomCount(newList.length);
                return newList;
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to reject participant");
        }
    };

    const handleRemoveParticipant = (identity: string) => {
        socket.emit("remove-participant", {meetingId, targetIdentity: identity});
        toast.success("Participant removed");
    };

    const handleMuteParticipant = (identity: string) => {
        socket.emit("mute-participant", {meetingId, targetIdentity: identity});
        toast.success("Participant muted");
    };

    const handleRequestUnmute = (identity: string, name: string) => {
        socket.emit("request-unmute", {meetingId, targetIdentity: identity});
        toast.success(`Unmute request sent to ${name}`);
    };

    const filteredParticipants = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return participants;
        return participants.filter(p => (p.name || p.identity).toLowerCase().includes(q));
    }, [participants, query]);

    const filteredWaiting = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return waitingRoomParticipants;
        return waitingRoomParticipants.filter(p =>
            `${p.user.firstName} ${p.user.lastName ?? ""}`.toLowerCase().includes(q)
        );
    }, [waitingRoomParticipants, query]);

    return (
        <div className="flex h-full flex-col">
            {/* Search */}
            <div className="border-b border-border/50 p-3 dark:border-white/10">
                <GlassSurface
                    borderRadius={999}
                    width="100%"
                    height={36}
                    backgroundOpacity={0.05}
                    blur={20}
                    contentClassName="p-0"
                >
                    <div className="relative w-full h-full flex items-center">
                        <Search className="pointer-events-none absolute left-3 text-muted-foreground/60 size-4 dark:text-white/40" />
                        <Input
                            value={query}
                            onChange={event => setQuery(event.target.value)}
                            placeholder="Search people"
                            aria-label="Search participants"
                            className="h-full w-full bg-transparent border-none pl-9 text-xs font-medium text-foreground/90 placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-white/90 dark:placeholder:text-white/30"
                        />
                    </div>
                </GlassSurface>
            </div>

            <ScrollArea className="min-h-0 flex-1">
                <div className="flex flex-col gap-4 p-3">
                    {/* Waiting Room */}
                    {isHost && filteredWaiting.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Waiting room
                                </span>
                                <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
                                    {filteredWaiting.length}
                                </Badge>
                            </div>
                            <div className="flex flex-col gap-2">
                                {filteredWaiting.map((p) => {
                                    const name = `${p.user.firstName} ${p.user.lastName ?? ""}`.trim();
                                    return (
                                        <GlassSurface
                                            key={p.id}
                                            borderRadius={999}
                                            width="100%"
                                            height="auto"
                                            backgroundOpacity={0.03}
                                            blur={10}
                                            className="border border-border dark:border-white/5"
                                            contentClassName="flex items-center justify-between gap-3 p-3 "
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="relative">
                                                    <Avatar className="size-10 border border-border shadow-lg dark:border-white/10">
                                                        {p.user.imageUrl && <AvatarImage src={p.user.imageUrl} alt="" />}
                                                        <AvatarFallback className="bg-muted text-xs font-bold text-muted-foreground dark:bg-white/5">{initials(name)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-background p-0.5">
                                                        <span className="size-full rounded-full bg-accent animate-pulse" />
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-foreground/90 dark:text-white/90">{name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label={`Approve ${name}`}
                                                    className="size-8 rounded-full text-primary hover:bg-primary/20 hover:text-primary transition-all active:scale-90"
                                                    onClick={() => handleApprove(p.id)}
                                                >
                                                    <Check size={16} />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    aria-label={`Reject ${name}`}
                                                    className="size-8 rounded-full text-destructive hover:bg-destructive/20 hover:text-destructive transition-all active:scale-90"
                                                    onClick={() => handleReject(p.id)}
                                                >
                                                    <X size={16} />
                                                </Button>
                                            </div>
                                        </GlassSurface>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* In Meeting */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                In meeting
                            </span>
                            <Badge variant="outline" className="border-border dark:border-white/10">
                                {filteredParticipants.length}
                            </Badge>
                        </div>
                        <div className="flex flex-col gap-2">
                            {filteredParticipants.map(p => {
                                const name = p.name || p.identity || "Guest";
                                let metadata: Record<string, unknown> | null = null;
                                try {
                                    if (p.metadata) metadata = JSON.parse(p.metadata);
                                } catch {}
                                const isMicOn = p.isMicrophoneEnabled;
                                const isCamOn = p.isCameraEnabled;
                                const raisedHand = p.metadata?.toLowerCase().includes("hand");
                                const showHost = isHost && p.isLocal;

                                return (
                                    <div
                                            key={p.identity}
                                            className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 transition-all hover:bg-muted/50 group overflow-hidden dark:hover:bg-white/5"
                                        >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="relative shrink-0">
                                                <Avatar className="size-10 border border-border shadow-md group-hover:border-border/80 transition-colors dark:border-white/10 dark:group-hover:border-white/20">
                                                    {typeof metadata?.imageUrl === "string" && <AvatarImage src={metadata.imageUrl} alt={name} />}
                                                    <AvatarFallback className="bg-muted text-xs font-bold text-muted-foreground dark:bg-white/5">{initials(name)}</AvatarFallback>
                                                </Avatar>
                                                <span
                                                    className={cn(
                                                        "absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-background transition-all duration-500",
                                                        p.isSpeaking ? "bg-primary scale-110 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" : "bg-muted-foreground/40 scale-100"
                                                    )}
                                                    aria-label={p.isSpeaking ? "Speaking" : "Not speaking"}
                                                />
                                            </div>
                                            <div className="min-w-0 overflow-hidden">
                                                <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                                                    <p className="truncate text-sm font-bold text-foreground/90 dark:text-white/90">
                                                        {p.isLocal ? `${name} (You)` : name}
                                                    </p>
                                                    {showHost && (
                                                        <Badge variant="secondary" className="shrink-0 h-4 px-1.5 text-[9px] font-bold uppercase tracking-wider bg-muted text-foreground border-none dark:bg-white/10 dark:text-white">
                                                            Host
                                                        </Badge>
                                                    )}
                                                    {raisedHand && (
                                                        <Hand className="shrink-0 raised-hand text-primary size-3.5" aria-label="Raised hand" />
                                                    )}
                                                </div>
                                                <p className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 dark:text-white/40">
                                                    {p.isSpeaking ? "Speaking" : "Connected"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2">
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/30 dark:bg-white/5 border border-border/50 dark:border-white/5">
                                                <div className={cn("transition-colors", !isMicOn ? "text-red-500" : "text-muted-foreground/40 dark:text-white/40")}>
                                                    {isMicOn
                                                        ? <Mic size={14} aria-label="Microphone on" />
                                                        : <MicOff size={14} aria-label="Muted" />
                                                    }
                                                </div>
                                                <div className={cn("transition-colors", !isCamOn ? "text-red-500" : "text-muted-foreground/40 dark:text-white/40")}>
                                                    {isCamOn
                                                        ? <Video size={14} aria-label="Camera on" />
                                                        : <VideoOff size={14} aria-label="Camera off" />
                                                    }
                                                </div>
                                            </div>

                                            {isHost && !p.isLocal && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 rounded-full hover:bg-muted dark:hover:bg-white/10 transition-all active:scale-90"
                                                        >
                                                            <MoreHorizontal size={16} className="text-muted-foreground" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl glass-surface-heavy shadow-2xl border-white/10">
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            transition={{
                                                                type: "spring",
                                                                stiffness: 300,
                                                                damping: 20,
                                                                staggerChildren: 0.05,
                                                                delayChildren: 0.05
                                                            }}
                                                        >
                                                            {isMicOn ? (
                                                                <motion.div
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                >
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleMuteParticipant(p.identity)}
                                                                        className="rounded-xl gap-3 py-3 cursor-pointer text-amber-500 focus:text-amber-500 focus:bg-amber-500/10 transition-colors"
                                                                    >
                                                                        <MicOff size={18} />
                                                                        <span className="font-bold text-base">Mute Participant</span>
                                                                    </DropdownMenuItem>
                                                                </motion.div>
                                                            ) : (
                                                                <motion.div
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                >
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleRequestUnmute(p.identity, name)}
                                                                        className="rounded-xl gap-3 py-3 cursor-pointer text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/10 transition-colors"
                                                                    >
                                                                        <Mic size={18} />
                                                                        <span className="font-bold text-base">Request Unmute</span>
                                                                    </DropdownMenuItem>
                                                                </motion.div>
                                                            )}
                                                            <motion.div
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                            >
                                                                <DropdownMenuSeparator className="bg-white/10 my-1.5" />
                                                            </motion.div>
                                                            <motion.div
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                            >
                                                                <DropdownMenuItem
                                                                    onClick={() => handleRemoveParticipant(p.identity)}
                                                                    variant="destructive"
                                                                    className="rounded-xl gap-3 py-3 cursor-pointer transition-colors"
                                                                >
                                                                    <UserMinus size={18} />
                                                                    <span className="font-bold text-base">Remove</span>
                                                                </DropdownMenuItem>
                                                            </motion.div>
                                                        </motion.div>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
