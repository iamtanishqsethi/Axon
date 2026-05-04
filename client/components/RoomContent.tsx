"use client";

import {
    RoomAudioRenderer,
    useRoomContext,
    useTracks,
} from "@livekit/components-react";
import {MotionConfig} from "framer-motion";
import {useEffect, useMemo, useState} from "react";
import {Track, RoomEvent, type Participant} from "livekit-client";
import {useMeetingStore} from "@/store/meetingStore";
import ParticipantTile, {getMeetingTrackId} from "@/components/ui-meet/ParticipantTile";
import {socket} from "@/lib/socket";
import {ChatMessage} from "@/types/store.types";

import {MeetingTopBar} from "@/components/ui-meet/MeetingTopBar";
import BentoVideoGrid from "@/components/ui-meet/BentoVideoGrid";
import MeetingDock from "@/components/ui-meet/MeetingDock";
import TabbedSidebar from "@/components/ui-meet/TabbedSidebar";
import SettingsDialog from "@/components/ui-meet/SettingsDialog";
import {ReactionsOverlay, type ReactionItem} from "@/components/ui-meet/ReactionsOverlay";
import {playMeetingSound} from "@/lib/meeting-sounds";
import {Spinner} from "@/components/kibo-ui/spinner";
import {motion} from "framer-motion";
import dynamic from "next/dynamic";
import CollaborativeWhiteboard from "@/components/ui/CollaborativeWhiteboard";
import {toast} from "sonner";
import {Mic} from "lucide-react";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";

const CollaborativeEditor = dynamic(
  () => import("@/components/ui/CollaborativeEditor"),
  { ssr: false }
);

export function RoomContent({
    handleLeave,
    handleEndMeeting,
    meetingId,
}: {
    handleLeave: () => Promise<void>,
    handleEndMeeting: () => Promise<void>,
    meetingId: string
}) {
    const isHost = useMeetingStore(store => store.isHost);
    const addMessage = useMeetingStore(store => store.setChatMessages);
    const activePanel = useMeetingStore(store => store.activePanel);
    const setActivePanel = useMeetingStore(store => store.setActivePanel);
    const togglePanel = useMeetingStore(store => store.togglePanel);
    const waitingRoomCount = useMeetingStore(store => store.waitingRoomCount);
    const setWaitingRoomCount = useMeetingStore(store => store.setWaitingRoomCount);
    const room = useRoomContext();
    const [duration, setDuration] = useState(0);
    const [layoutMode, setLayoutMode] = useState<"grid" | "speaker">("grid");
    const [pinnedTrackId, setPinnedTrackId] = useState<string | null>(null);
    const [activeSpeakerIds, setActiveSpeakerIds] = useState<string[]>(() =>
        room.activeSpeakers.map(speaker => speaker.identity)
    );
    const [unreadCount, setUnreadCount] = useState(0);
    const [reactions, setReactions] = useState<ReactionItem[]>([]);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const tracks = useTracks(
        [
            {source: Track.Source.Camera, withPlaceholder: true},
            {source: Track.Source.ScreenShare, withPlaceholder: false},
        ],
        {onlySubscribed: false}
    );

    const visibleTracks = useMemo(() =>
            tracks.filter(t =>
                t.source === Track.Source.ScreenShare ||
                t.source === Track.Source.Camera
            ),
        [tracks]
    );

    const screenShareTrack = useMemo(() =>
            visibleTracks.find(t => t.source === Track.Source.ScreenShare),
        [visibleTracks]
    );

    const pinnedTrack = useMemo(() =>
            pinnedTrackId ? visibleTracks.find(t => getMeetingTrackId(t) === pinnedTrackId) : undefined,
        [pinnedTrackId, visibleTracks]
    );

    const speakerTrack = useMemo(() =>
            visibleTracks.find(t =>
                t.source === Track.Source.Camera &&
                activeSpeakerIds.includes(t.participant.identity)
            ),
        [activeSpeakerIds, visibleTracks]
    );

    const spotlightTrack = screenShareTrack ?? pinnedTrack ?? (layoutMode === "speaker" ? speakerTrack : undefined);

    // Timer
    useEffect(() => {
        const interval = setInterval(() => {
            if (room.state === "connected") setDuration(p => p + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [room.state]);

    // Active speakers
    useEffect(() => {
        const updateSpeakers = (speakers: Participant[]) => {
            setActiveSpeakerIds(speakers.map(speaker => speaker.identity));
        };

        queueMicrotask(() => updateSpeakers(room.activeSpeakers));
        room.on(RoomEvent.ActiveSpeakersChanged, updateSpeakers);
        return () => {
            room.off(RoomEvent.ActiveSpeakersChanged, updateSpeakers);
        };
    }, [room]);

    // Initial waiting room fetch for host
    useEffect(() => {
        if (!isHost) return;
        const fetchWaiting = async () => {
            try {
                const { getWaitingRoom } = await import("@/services/api");
                const data = await getWaitingRoom(meetingId);
                setWaitingRoomCount(data.length);
            } catch (error) {
                console.error("Error fetching waiting room initial count:", error);
            }
        };
        fetchWaiting();
    }, [isHost, meetingId, setWaitingRoomCount]);

    // Participant join/leave toasts
    useEffect(() => {
        const handleParticipant = (participant: Participant, action: "joined" | "left") => {
            playMeetingSound(action);
            
            const displayName = participant.name || participant.identity || "A participant";
            let imageUrl: string | undefined = undefined;
            try {
                if (participant.metadata) {
                    const metadata = JSON.parse(participant.metadata);
                    imageUrl = metadata.imageUrl;
                }
            } catch {
                // ignore parsing errors
            }

            toast.custom((t) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-border/50 bg-muted/50 dark:bg-white/5">
                        <AvatarImage src={imageUrl} alt={displayName} />
                        <AvatarFallback className="bg-transparent font-medium">
                            {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium tracking-wide">
                        <span className="font-bold text-foreground dark:text-white">{displayName}</span> has {action}
                    </span>
                </div>
            ));
        };

        const onConnected = (participant: Participant) => handleParticipant(participant, "joined");
        const onDisconnected = (participant: Participant) => handleParticipant(participant, "left");

        room.on(RoomEvent.ParticipantConnected, onConnected);
        room.on(RoomEvent.ParticipantDisconnected, onDisconnected);
        return () => {
            room.off(RoomEvent.ParticipantConnected, onConnected);
            room.off(RoomEvent.ParticipantDisconnected, onDisconnected);
        };
    }, [room]);

    // Reset unread when chat is open
    useEffect(() => {
        if (activePanel === "chat") queueMicrotask(() => setUnreadCount(0));
    }, [activePanel]);

    // Chat messages from socket
    useEffect(() => {
        const handleMessage = (message: ChatMessage) => {
            if (message.userId === socket.id) return;
            addMessage(message);
            playMeetingSound("message");
            if (activePanel !== "chat") {
                setUnreadCount(count => count + 1);
            }
        };

        socket.on("chat-message", handleMessage);

        return () => {
            socket.off("chat-message", handleMessage);
        };
    }, [addMessage, activePanel]);

    // Reactions from socket
    useEffect(() => {
        const handleReaction = (data: { emoji: string }) => {
            const id = `${data.emoji}-${Date.now()}-${Math.random()}`;
            const reaction = {
                id,
                emoji: data.emoji,
                x: Math.round((Math.random() - 0.5) * 180),
            };

            setReactions(current => [...current, reaction]);
            window.setTimeout(() => {
                setReactions(current => current.filter(item => item.id !== id));
            }, 820);
        };

        socket.on("reaction", handleReaction);
        
        const handleNewWaitingUser = () => {
            if (isHost) {
                const fetchWaiting = async () => {
                    try {
                        const { getWaitingRoom } = await import("@/services/api");
                        const data = await getWaitingRoom(meetingId);
                        setWaitingRoomCount(data.length);
                    } catch (error) {
                        console.error("Error updating waiting count:", error);
                    }
                };
                fetchWaiting();
            }
        };

        socket.on("new-waiting-user", handleNewWaitingUser);

        return () => {
            socket.off("reaction", handleReaction);
            socket.off("new-waiting-user", handleNewWaitingUser);
        };
    }, [isHost, meetingId, setWaitingRoomCount]);

    // Host-initiated remove / mute / unmute-request
    useEffect(() => {
        const handleYouWereRemoved = () => {
            toast.error("You have been removed from the meeting by the host.");
            void handleLeave();
        };

        const handleYouWereMuted = async () => {
            try {
                await room.localParticipant.setMicrophoneEnabled(false);
                toast.warning("Your microphone was muted by the host.");
            } catch (e) {
                console.error("Failed to mute local mic:", e);
            }
        };

        const handleUnmuteRequested = () => {
            toast("Host requested you to unmute", {
                icon: <Mic className="size-5 text-emerald-500" />,
                duration: 10000,
                action: {
                    label: "Unmute",
                    onClick: () => {
                        void room.localParticipant.setMicrophoneEnabled(true);
                    },
                },
                cancel: {
                    label: "Dismiss",
                    onClick: () => {},
                },
            });
        };

        socket.on("you-were-removed", handleYouWereRemoved);
        socket.on("you-were-muted", handleYouWereMuted);
        socket.on("unmute-requested", handleUnmuteRequested);

        return () => {
            socket.off("you-were-removed", handleYouWereRemoved);
            socket.off("you-were-muted", handleYouWereMuted);
            socket.off("unmute-requested", handleUnmuteRequested);
        };
    }, [handleLeave, room]);

    const togglePin = (trackId: string) => {
        setPinnedTrackId(current => current === trackId ? null : trackId);
    };

    const addReaction = (emoji: string) => {
        const id = `${emoji}-${Date.now()}-${Math.random()}`;
        const reaction = {
            id,
            emoji,
            x: Math.round((Math.random() - 0.5) * 180),
        };

        setReactions(current => [...current, reaction]);
        window.setTimeout(() => {
            setReactions(current => current.filter(item => item.id !== id));
        }, 820);

        socket.emit("reaction", { meetingId, emoji });
    };

    const visibleUnreadCount = activePanel === "chat" ? 0 : unreadCount;

    // Connecting/reconnecting state
    if (room.state === "connecting" || room.state === "reconnecting") {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4 bg-background">
                <motion.div
                    initial={{opacity: 0, scale: 0.95}}
                    animate={{opacity: 1, scale: 1}}
                    className={'flex flex-col items-center justify-center gap-4'}
                >
                    <Spinner variant={'bars'} size={40} />
                    <div className="text-center">
                        <h2 className="text-2xl font-bold tracking-wide uppercase text-foreground/90">
                            {room.state === "connecting" ? "Entering Room" : "Reconnecting"}
                        </h2>
                        <p className="text-muted-foreground mt-2 text-sm">
                            {room.state === "connecting" ? "Preparing your secure session..." : "Restoring your connection..."}
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <MotionConfig reducedMotion="user">
            <div className="flex h-full w-full overflow-hidden bg-background">
                <div className="relative flex min-w-0 flex-1 flex-col">
                    <MeetingTopBar
                        duration={duration}
                        roomName={room.name}
                        layoutMode={layoutMode}
                        onLayoutModeChange={setLayoutMode}
                        meetingId={meetingId}
                    />

                    <main className="relative min-h-0 flex-1 overflow-hidden p-3 pb-24 pt-16 sm:p-4 sm:pb-24 sm:pt-16">
                        {activePanel === "editor" || activePanel === "whiteboard" ? (
                            <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[minmax(0,0.72fr)_minmax(14rem,0.28fr)]">
                                <div className="min-h-[22rem] w-full h-full relative rounded-xl overflow-hidden border border-border shadow-2xl dark:border-white/10">
                                    {activePanel === "editor" ? (
                                        <CollaborativeEditor 
                                            roomId={meetingId} 
                                            userName={room.localParticipant?.name || room.localParticipant?.identity || "Participant"} 
                                        />
                                    ) : (
                                        <CollaborativeWhiteboard 
                                            roomId={meetingId} 
                                            userName={room.localParticipant?.name || room.localParticipant?.identity || "Participant"} 
                                        />
                                    )}
                                </div>
                                <div className="grid min-h-0 grid-cols-2 gap-3 overflow-y-auto lg:grid-cols-1">
                                    {visibleTracks.map(trackRef => {
                                        const trackId = getMeetingTrackId(trackRef);
                                        return (
                                            <ParticipantTile
                                                key={trackId}
                                                trackRef={trackRef}
                                                isPinned={pinnedTrackId === trackId}
                                                isHost={isHost}
                                                onTogglePin={togglePin}
                                                className="min-h-28"
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <BentoVideoGrid
                                tracks={visibleTracks}
                                spotlightTrack={spotlightTrack}
                                pinnedTrackId={pinnedTrackId}
                                isHost={isHost}
                                onTogglePin={togglePin}
                            />
                        )}
                    </main>

                    <ReactionsOverlay reactions={reactions} />

                    <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-4">
                        <MeetingDock
                            onLeave={handleLeave}
                            onEndMeeting={handleEndMeeting}
                            onReaction={addReaction}
                            onOpenSettings={() => setSettingsOpen(true)}
                            onTogglePanel={togglePanel}
                            activePanel={activePanel}
                            unreadCount={visibleUnreadCount}
                            waitingRoomCount={waitingRoomCount}
                            layoutMode={layoutMode}
                            onLayoutModeChange={setLayoutMode}
                            isHost={isHost}
                        />
                    </div>
                </div>

                <TabbedSidebar
                    meetingId={meetingId}
                    activePanel={activePanel}
                    onClose={() => setActivePanel(null)}
                    onTabChange={togglePanel}
                    unreadCount={visibleUnreadCount}
                />

                <SettingsDialog
                    open={settingsOpen}
                    onOpenChange={setSettingsOpen}
                    layoutMode={layoutMode}
                    onLayoutModeChange={setLayoutMode}
                />

                <RoomAudioRenderer />
            </div>
        </MotionConfig>
    );
}
