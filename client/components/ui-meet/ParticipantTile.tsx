"use client";

import type {ParticipantTileProps} from "@livekit/components-react";
import {VideoTrack} from "@livekit/components-react";
import {ConnectionQuality, Track} from "livekit-client";
import {motion} from "framer-motion";
import {Maximize2, MicOff, Pin, PinOff, ScreenShare} from "lucide-react";
import {useMemo, useRef} from "react";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {cn} from "@/lib/utils";

type TrackRef = NonNullable<ParticipantTileProps["trackRef"]>;

interface ParticipantTileProps2 {
    trackRef: TrackRef;
    isPinned?: boolean;
    isHost?: boolean;
    onTogglePin?: (trackId: string) => void;
    className?: string;
}

export function getMeetingTrackId(trackRef: TrackRef) {
    const publicationId = trackRef.publication?.trackSid ?? "placeholder";
    return `${trackRef.participant.identity}-${trackRef.source}-${publicationId}`;
}

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2);
    return initials.toUpperCase();
}

function getQualityDots(quality: ConnectionQuality | undefined) {
    if (quality === ConnectionQuality.Excellent) return 3;
    if (quality === ConnectionQuality.Good) return 2;
    if (quality === ConnectionQuality.Poor) return 1;
    return 0;
}

function getQualityClass(quality: ConnectionQuality | undefined) {
    if (quality === ConnectionQuality.Excellent || quality === ConnectionQuality.Good) {
        return "bg-[var(--quality-good)]";
    }
    if (quality === ConnectionQuality.Poor) return "bg-[var(--quality-warn)]";
    return "bg-[var(--quality-poor)]";
}

function TileActionButton({
    label,
    disabled,
    onClick,
    children,
}: {
    label: string;
    disabled?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    aria-label={label}
                    disabled={disabled}
                    onClick={(event) => {
                        event.stopPropagation();
                        onClick?.();
                    }}
                    className="interactive-lift size-8 border bg-background/70 backdrop-blur-xl"
                >
                    {children}
                </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
}

export default function ParticipantTile({
    trackRef,
    isPinned = false,
    isHost = false,
    onTogglePin,
    className,
}: ParticipantTileProps2) {
    const tileRef = useRef<HTMLDivElement>(null);
    const participant = trackRef.participant;
    const trackId = useMemo(() => getMeetingTrackId(trackRef), [trackRef]);
    const displayName = participant.name || participant.identity || "Guest";
    const metadata = useMemo(() => {
        try {
            return participant.metadata ? JSON.parse(participant.metadata) : null;
        } catch {
            return null;
        }
    }, [participant.metadata]);
    const qualityDots = getQualityDots(participant.connectionQuality);
    const hasPlayableVideo = Boolean(trackRef.publication?.track && !trackRef.publication.isMuted);
    const isScreenShare = trackRef.source === Track.Source.ScreenShare;
    const isCameraOff = trackRef.source === Track.Source.Camera && (!participant.isCameraEnabled || !hasPlayableVideo);
    const isMuted = !participant.isMicrophoneEnabled;

    const togglePin = () => onTogglePin?.(trackId);
    const requestFullscreen = () => tileRef.current?.requestFullscreen?.();

    return (
        <motion.div
            ref={tileRef}
            layout
            layoutId={trackId}
            initial={{opacity: 0, scale: 0.9}}
            animate={{opacity: 1, scale: 1}}
            exit={{opacity: 0, scale: 0.95}}
            transition={{type: "spring", stiffness: 300, damping: 28}}
            onDoubleClick={togglePin}
            className={cn(
                "group relative flex size-full min-h-40 overflow-hidden rounded-xl border border-tile-border bg-tile-bg text-foreground shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] backdrop-blur-md outline-none transition-all duration-300 dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]",
                "hover:border-primary/30 hover:shadow-2xl",
                "focus-visible:ring-[3px] focus-visible:ring-primary/50",
                participant.isSpeaking && "ring-2 ring-primary/60 border-primary/50 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]",
                className
            )}
            tabIndex={0}
            aria-label={`${displayName}${isMuted ? ", muted" : ""}`}
        >
            {/* Glass Inner Glow */}
            <div className="absolute inset-0 pointer-events-none rounded-[inherit] ring-1 ring-inset ring-white/5 dark:ring-white/10" />
            {/* Video or avatar */}
            {hasPlayableVideo ? (
                <VideoTrack
                    trackRef={trackRef as Exclude<TrackRef, {publication?: never}>}
                    className={cn("size-full object-cover transition-transform duration-700 group-hover:scale-[1.02]", isCameraOff && "blur-xl scale-110")}
                />
            ) : (
                <div className="relative flex size-full items-center justify-center overflow-hidden bg-muted/30">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.05)_0%,transparent_70%)]" />
                    <Avatar className="size-24 border border-tile-border bg-background/50 backdrop-blur-xl shadow-2xl">
                        {metadata?.imageUrl && <AvatarImage src={metadata.imageUrl} alt={displayName} />}
                        <AvatarFallback className="bg-transparent text-2xl font-semibold text-foreground/80">
                            {getInitials(displayName)}
                        </AvatarFallback>
                    </Avatar>
                </div>
            )}

            {/* Bottom gradient scrim */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-40 dark:from-black/80 dark:via-black/20 dark:opacity-60" />

            {/* Bottom-left: name + mute indicator */}
            <div className="absolute left-3 bottom-3 flex max-w-[calc(100%-6rem)] items-center gap-2 z-10">
                {isMuted && (
                    <motion.span 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex size-7 items-center justify-center rounded-full bg-red-500/20 text-red-400 backdrop-blur-xl border border-red-500/30 shadow-lg"
                    >
                        <MicOff className="size-3.5" aria-label="Muted" />
                    </motion.span>
                )}
                <div className="min-w-0 rounded-full bg-background/60 border border-tile-border px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase text-foreground/90 backdrop-blur-2xl shadow-xl dark:bg-white/5 dark:text-white/90">
                    <span className="block truncate">
                        {participant.isLocal ? `${displayName} (You)` : displayName}
                    </span>
                </div>
            </div>

            {/* Top-right: badges + quality */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                {isScreenShare && (
                    <Badge variant="secondary" className="rounded-full border border-tile-border bg-background/60 backdrop-blur-xl text-foreground/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-xl dark:bg-white/5 dark:text-white/90">
                        <ScreenShare className="size-3 mr-1.5 opacity-70" />
                        Screen
                    </Badge>
                )}
                {isPinned && (
                    <Badge className="rounded-full bg-primary/10 text-primary border border-primary/20 backdrop-blur-xl px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-xl dark:bg-primary/20">
                        <Pin className="size-3 mr-1.5" />
                        Pinned
                    </Badge>
                )}
                <div
                    className="flex items-end gap-0.5 rounded-full bg-background/60 border border-tile-border px-2.5 py-1.5 backdrop-blur-xl shadow-xl dark:bg-white/5"
                    aria-label={`Network quality ${participant.connectionQuality ?? "unknown"}`}
                >
                    {[0, 1, 2].map((dot) => (
                        <span
                            key={dot}
                            className={cn(
                                "block w-1.5 rounded-full transition-all duration-500",
                                dot === 0 && "h-1.5",
                                dot === 1 && "h-2.5",
                                dot === 2 && "h-3.5",
                                dot < qualityDots ? getQualityClass(participant.connectionQuality) : "bg-white/10"
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* Top-left: hover controls */}
            <div className="absolute top-3 left-3 flex items-center gap-2 opacity-0 transition-all duration-300 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 z-20">
                <TileActionButton label={isPinned ? "Unpin participant" : "Pin participant"} onClick={togglePin}>
                    {isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                </TileActionButton>
                <TileActionButton label="Fullscreen tile" onClick={requestFullscreen}>
                    <Maximize2 className="size-4" />
                </TileActionButton>
            </div>
        </motion.div>
    );
}
