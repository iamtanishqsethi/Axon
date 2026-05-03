"use client";

import {useLocalParticipant, useRoomContext} from "@livekit/components-react";
import {
    LogOut,
    MessageCircle,
    Mic,
    MicOff,
    MoreHorizontal,
    PhoneOff,
    ScreenShare,
    ScreenShareOff,
    Settings,
    Smile,
    Users,
    Video,
    VideoOff,
    Pen,
} from "lucide-react";
import {useState} from "react";
import {FloatingDock} from "@/components/ui/floating-dock";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Badge} from "@/components/ui/badge";
import {cn} from "@/lib/utils";
import {Spinner} from "@/components/kibo-ui/spinner";
import GlassSurface from "@/components/GlassSurface";
import LeaveDialog from "@/components/ui-meet/LeaveDialog";

interface MeetingDockProps {
    onLeave: () => void;
    onEndMeeting: () => void;
    onReaction: (emoji: string) => void;
    onOpenSettings: () => void;
    onTogglePanel: (panel: "chat" | "participants" | "editor" | "whiteboard") => void;
    activePanel: "chat" | "participants" | "editor" | "whiteboard" | null;
    unreadCount: number;
    waitingRoomCount: number;
    layoutMode: "grid" | "speaker";
    onLayoutModeChange: (mode: "grid" | "speaker") => void;
    isHost: boolean;
}

type PendingAction = "mic" | "camera" | "screen" | "leave" | "end" | null;

export default function MeetingDock({
    onLeave,
    onEndMeeting,
    onReaction,
    onOpenSettings,
    onTogglePanel,
    activePanel,
    unreadCount,
    waitingRoomCount,
    isHost,
}: MeetingDockProps) {
    const room = useRoomContext();
    const {
        localParticipant,
        isMicrophoneEnabled,
        isCameraEnabled,
        isScreenShareEnabled,
    } = useLocalParticipant();
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [moreOpen, setMoreOpen] = useState(false);
    const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

    const runMediaAction = async (action: PendingAction, fn: () => Promise<unknown>) => {
        if (pendingAction) return;
        setPendingAction(action);
        try {
            await fn();
        } catch (error) {
            console.error(error);
        } finally {
            setPendingAction(null);
        }
    };

    const leave = () => {
        setPendingAction("leave");
        void room.disconnect();
        onLeave();
    };

    const endMeeting = () => {
        setPendingAction("end");
        onEndMeeting();
    };

    const openLeaveDialog = () => setLeaveDialogOpen(true);

    const reactionItems = ["👍", "👏", "🔥", "❤️", "😂", "🎉"];

    const items = [
        {
            title: isMicrophoneEnabled ? "Mute" : "Unmute",
            icon: pendingAction === "mic" ? (
                <Spinner variant={'bars'} />
            ) : isMicrophoneEnabled ? (
                <Mic />
            ) : (
                <MicOff />
            ),
            onClick: () => runMediaAction("mic", () => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)),
            className: cn(!isMicrophoneEnabled && "!bg-red-500/20 !text-red-400 !border-red-500/30"),
        },
        {
            title: isCameraEnabled ? "Stop Video" : "Start Video",
            icon: pendingAction === "camera" ? (
                <Spinner variant={'bars'} />
            ) : isCameraEnabled ? (
                <Video />
            ) : (
                <VideoOff />
            ),
            onClick: () => runMediaAction("camera", () => localParticipant.setCameraEnabled(!isCameraEnabled)),
            className: cn(!isCameraEnabled && "!bg-red-500/20 !text-red-400 !border-red-500/30"),
        },
        {
            title: isScreenShareEnabled ? "Stop Sharing" : "Share Screen",
            icon: pendingAction === "screen" ? (
                <Spinner variant={'bars'} />
            ) : isScreenShareEnabled ? (
                <ScreenShareOff />
            ) : (
                <ScreenShare />
            ),
            onClick: () => runMediaAction("screen", () => localParticipant.setScreenShareEnabled(!isScreenShareEnabled)),
            className: cn(isScreenShareEnabled && "!bg-primary/20 !text-primary !border-primary/30"),
        },
        {
            title: "Reactions",
            icon: (
                <Popover>
                    <PopoverTrigger asChild>
                        <div className="flex size-full items-center justify-center">
                            <Smile />
                        </div>
                    </PopoverTrigger>
                    <PopoverContent side="top" className="w-fit rounded-xl bg-popover border border-border p-2 backdrop-blur-2xl shadow-2xl dark:bg-white/5 dark:border-white/10">
                        <div className="flex gap-1">
                            {reactionItems.map((emoji) => (
                                <Button
                                    key={emoji}
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`React ${emoji}`}
                                    onClick={() => onReaction(emoji)}
                                    className="interactive-lift size-10 text-xl hover:bg-muted"
                                >
                                    {emoji}
                                </Button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            ),
        },
        {
            title: "Editor",
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-code"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
            onClick: () => onTogglePanel("editor"),
            className: cn(activePanel === "editor" && "!bg-primary/10 !border-primary/30 dark:!bg-white/15 dark:!border-white/30"),
        },
        {
            title: "Whiteboard",
            icon: <Pen />,
            onClick: () => onTogglePanel("whiteboard"),
            className: cn(activePanel === "whiteboard" && "!bg-primary/10 !border-primary/30 dark:!bg-white/15 dark:!border-white/30"),
        },
        {
            title: "Participants",
            icon: (
                <div className="relative flex size-full items-center justify-center">
                    <Users />
                    {isHost && waitingRoomCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 min-w-4 px-1 text-[10px] bg-red-500 text-white border-none">
                            {waitingRoomCount > 9 ? "9+" : waitingRoomCount}
                        </Badge>
                    )}
                </div>
            ),
            onClick: () => onTogglePanel("participants"),
            className: cn(activePanel === "participants" && "!bg-primary/10 !border-primary/30 dark:!bg-white/15 dark:!border-white/30"),
        },
        {
            title: "Chat",
            icon: (
                <div className="relative flex size-full items-center justify-center">
                    <MessageCircle />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 min-w-4 px-1 text-[10px] bg-primary text-white border-none">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </div>
            ),
            onClick: () => onTogglePanel("chat"),
            className: cn(activePanel === "chat" && "!bg-primary/10 !border-primary/30 dark:!bg-white/15 dark:!border-white/30"),
        },
        {
            title: "Settings",
            icon: <Settings />,
            onClick: onOpenSettings,
        },
        {
            title: "Leave",
            icon: pendingAction === "leave" ? <Spinner variant={'bars'} /> : <PhoneOff />,
            onClick: openLeaveDialog,
            className: "!bg-red-500 !text-white shadow-[0_8px_24px_rgba(239,68,68,0.4)] hover:bg-red-500/90 !border-none",
        },
    ];

    if (isHost) {
        items.push({
            title: "End Meeting",
            icon: pendingAction === "end" ? <Spinner variant={'bars'} /> : <LogOut />,
            onClick: openLeaveDialog,
            className: "!bg-red-600 !text-white shadow-[0_8px_24px_rgba(220,38,38,0.4)] hover:bg-red-600/90 !border-none",
        });
    }

    /* ── Secondary items for mobile "More" popover ── */
    const mobileSecondaryItems: {
        label: string;
        icon: React.ReactNode;
        onClick: () => void;
        className?: string;
        badge?: React.ReactNode;
    }[] = [
        {
            label: isScreenShareEnabled ? "Stop Sharing" : "Share Screen",
            icon: pendingAction === "screen" ? <Spinner variant={'bars'} className="size-4" /> : isScreenShareEnabled ? <ScreenShareOff className="size-4" /> : <ScreenShare className="size-4" />,
            onClick: () => { runMediaAction("screen", () => localParticipant.setScreenShareEnabled(!isScreenShareEnabled)); setMoreOpen(false); },
            className: cn(isScreenShareEnabled && "text-primary"),
        },
        {
            label: "Participants",
            icon: (
                <div className="relative">
                    <Users className="size-4" />
                    {isHost && waitingRoomCount > 0 && (
                        <Badge className="absolute -top-2 -right-2 min-w-4 px-1 text-[8px] bg-red-500 text-white border-none">
                            {waitingRoomCount > 9 ? "9+" : waitingRoomCount}
                        </Badge>
                    )}
                </div>
            ),
            onClick: () => { onTogglePanel("participants"); setMoreOpen(false); },
            className: cn(activePanel === "participants" && "text-primary"),
        },
        {
            label: "Code Editor",
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-code size-4"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
            onClick: () => { onTogglePanel("editor"); setMoreOpen(false); },
            className: cn(activePanel === "editor" && "text-primary"),
        },
        {
            label: "Whiteboard",
            icon: <Pen className="size-4" />,
            onClick: () => { onTogglePanel("whiteboard"); setMoreOpen(false); },
            className: cn(activePanel === "whiteboard" && "text-primary"),
        },
        {
            label: "Chat",
            icon: <MessageCircle className="size-4" />,
            onClick: () => { onTogglePanel("chat"); setMoreOpen(false); },
            className: cn(activePanel === "chat" && "text-primary"),
            badge: unreadCount > 0 ? (
                <Badge className="ml-auto min-w-5 justify-center px-1 text-[10px] bg-primary text-white border-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
            ) : undefined,
        },
        {
            label: "Settings",
            icon: <Settings className="size-4" />,
            onClick: () => { onOpenSettings(); setMoreOpen(false); },
        },
    ];

    if (isHost) {
        mobileSecondaryItems.push({
            label: "End Meeting",
            icon: pendingAction === "end" ? <Spinner variant={'bars'} className="size-4" /> : <LogOut className="size-4" />,
            onClick: () => { openLeaveDialog(); setMoreOpen(false); },
            className: "text-red-400",
        });
    }

    return (
        <>
        <div className="flex items-center justify-center max-w-full">
            {/* ── Desktop: full floating dock ── */}
            <div className="hidden md:block">
                <GlassSurface
                    borderRadius={999}
                    width="auto"
                    height="auto"
                    backgroundOpacity={0.05}
                    blur={20}
                    className="shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-visible"
                    contentClassName="p-0"
                >
                    <FloatingDock
                        items={items}
                        desktopClassName="border-none bg-transparent backdrop-blur-0 shadow-none"
                        mobileClassName="border-none bg-transparent backdrop-blur-0 shadow-none"
                    />
                </GlassSurface>
            </div>

            {/* ── Mobile: compact primary controls + more popover ── */}
            <div className="flex md:hidden">
                <GlassSurface
                    borderRadius={999}
                    width="auto"
                    height="auto"
                    backgroundOpacity={0.05}
                    blur={20}
                    className="shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-visible"
                    contentClassName="p-0"
                >
                    <div className="flex items-center gap-2 px-3 py-2">
                        {/* Mic */}
                        <button
                            onClick={() => runMediaAction("mic", () => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled))}
                            className={cn(
                                "flex size-11 items-center justify-center rounded-full bg-background/60 border border-border backdrop-blur-md transition-colors dark:bg-white/10 dark:border-white/10",
                                !isMicrophoneEnabled && "!bg-red-500/20 !text-red-400 !border-red-500/30"
                            )}
                        >
                            <div className="flex size-5 items-center justify-center">
                                {pendingAction === "mic" ? <Spinner variant={'bars'} /> : isMicrophoneEnabled ? <Mic /> : <MicOff />}
                            </div>
                        </button>

                        {/* Camera */}
                        <button
                            onClick={() => runMediaAction("camera", () => localParticipant.setCameraEnabled(!isCameraEnabled))}
                            className={cn(
                                "flex size-11 items-center justify-center rounded-full bg-background/60 border border-border backdrop-blur-md transition-colors dark:bg-white/10 dark:border-white/10",
                                !isCameraEnabled && "!bg-red-500/20 !text-red-400 !border-red-500/30"
                            )}
                        >
                            <div className="flex size-5 items-center justify-center">
                                {pendingAction === "camera" ? <Spinner variant={'bars'} /> : isCameraEnabled ? <Video /> : <VideoOff />}
                            </div>
                        </button>

                        {/* Reactions */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="flex size-11 items-center justify-center rounded-full bg-background/60 border border-border backdrop-blur-md transition-colors dark:bg-white/10 dark:border-white/10">
                                    <div className="flex size-5 items-center justify-center">
                                        <Smile />
                                    </div>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent side="top" className="w-fit rounded-xl bg-popover border border-border p-2 backdrop-blur-2xl shadow-2xl dark:bg-white/5 dark:border-white/10">
                                <div className="flex gap-1">
                                    {reactionItems.map((emoji) => (
                                        <Button
                                            key={emoji}
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`React ${emoji}`}
                                            onClick={() => onReaction(emoji)}
                                            className="interactive-lift size-10 text-xl hover:bg-muted"
                                        >
                                            {emoji}
                                        </Button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* More */}
                        <Popover open={moreOpen} onOpenChange={setMoreOpen}>
                            <PopoverTrigger asChild>
                                <button className={cn(
                                    "relative flex size-11 items-center justify-center rounded-full bg-background/60 border border-border backdrop-blur-md transition-colors dark:bg-white/10 dark:border-white/10",
                                    moreOpen && "!bg-muted !border-primary/20 dark:!bg-white/20 dark:!border-white/30"
                                )}>
                                    <div className="flex size-5 items-center justify-center">
                                        <MoreHorizontal />
                                    </div>
                                    {unreadCount > 0 && (
                                        <Badge className="absolute -top-1 -right-1 min-w-4 px-1 text-[10px] bg-primary text-white border-none">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </Badge>
                                    )}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent
                                side="top"
                                align="center"
                                className="w-48 rounded-2xl bg-popover/90 border border-border p-1.5 backdrop-blur-2xl shadow-2xl dark:bg-black/80 dark:border-white/10"
                            >
                                <div className="flex flex-col gap-0.5">
                                    {mobileSecondaryItems.map((item) => (
                                        <button
                                            key={item.label}
                                            onClick={item.onClick}
                                            className={cn(
                                                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-muted dark:text-white/80 dark:hover:bg-white/10",
                                                item.className
                                            )}
                                        >
                                            {item.icon}
                                            <span>{item.label}</span>
                                            {item.badge}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Leave */}
                        <button
                            onClick={openLeaveDialog}
                            className="flex size-11 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_8px_24px_rgba(239,68,68,0.4)] transition-colors hover:bg-red-500/90"
                        >
                            <div className="flex size-5 items-center justify-center">
                                {pendingAction === "leave" ? <Spinner variant={'bars'} /> : <PhoneOff />}
                            </div>
                        </button>
                    </div>
                </GlassSurface>
            </div>
        </div>

        <LeaveDialog
            open={leaveDialogOpen}
            onOpenChange={setLeaveDialogOpen}
            onLeave={leave}
            onEndMeeting={endMeeting}
            isHost={isHost}
        />
        </>
    );
}
