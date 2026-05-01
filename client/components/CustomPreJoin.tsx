"use client";

import { Camera, Mic, MicOff, Video, VideoOff, Sparkles, User, ChevronDown, Settings2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMeetingStore } from "@/store/meetingStore";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import GlassSurface from "./GlassSurface";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    SlideToUnlock,
    SlideToUnlockHandle,
    SlideToUnlockText,
    SlideToUnlockTrack
} from "@/components/slide-to-unlock/slide-to-unlock";
import {ShimmeringText} from "@/components/shimmering-text/shimmering-text";
import useSound from "use-sound";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CustomPreJoinProps {
    onSubmit: (values: {
        username: string;
        videoEnabled: boolean;
        audioEnabled: boolean;
        videoDeviceId: string;
        audioDeviceId: string;
    }) => void;
    userLabel?: string;
    meetingId?: string;
}

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2);
    return initials.toUpperCase();
}

export default function CustomPreJoin({ onSubmit, userLabel = "", meetingId }: CustomPreJoinProps) {
    const { user } = useUser();
    const mediaPreferences = useMeetingStore(state => state.mediaPreferences);
    const setMediaPreferences = useMeetingStore(state => state.setMediaPreferences);
    const [username, setUsername] = useState(mediaPreferences.username || userLabel || "");
    const videoRef = useRef<HTMLVideoElement>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [micLevel, setMicLevel] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);

    const videoDevices = devices.filter(device => device.kind === "videoinput");
    const audioDevices = devices.filter(device => device.kind === "audioinput");

    useEffect(() => {
        if (!navigator.mediaDevices?.enumerateDevices) return;

        const loadDevices = async () => {
            try {
                // Request permissions first to get labels
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                    stream.getTracks().forEach(t => t.stop());
                } catch (e) {
                    console.warn("Initial permission request failed, likely missing hardware:", e);
                }
                
                const nextDevices = await navigator.mediaDevices.enumerateDevices();
                setDevices(nextDevices);
            } catch (e) {
                console.error("Failed to load devices", e);
            }
        };

        void loadDevices();
        navigator.mediaDevices.addEventListener?.("devicechange", loadDevices);
        return () => navigator.mediaDevices.removeEventListener?.("devicechange", loadDevices);
    }, []);

    useEffect(() => {
        if (!navigator.mediaDevices?.getUserMedia) return;
        if (!mediaPreferences.videoEnabled && !mediaPreferences.audioEnabled) {
            if (videoRef.current) videoRef.current.srcObject = null;
            setMicLevel(0);
            return;
        }

        let cancelled = false;
        let stream: MediaStream | null = null;
        let frame = 0;
        let audioContext: AudioContext | null = null;

        const startPreview = async () => {
            try {
                const constraints = {
                    video: mediaPreferences.videoEnabled
                        ? {
                            ...(mediaPreferences.videoDeviceId ? { deviceId: { ideal: mediaPreferences.videoDeviceId } } : {}),
                            width: { ideal: 1280 },
                            height: { ideal: 720 }
                        }
                        : false,
                    audio: mediaPreferences.audioEnabled
                        ? (mediaPreferences.audioDeviceId ? { deviceId: { ideal: mediaPreferences.audioDeviceId } } : true)
                        : false,
                };
                
                try {
                    stream = await navigator.mediaDevices.getUserMedia(constraints);
                } catch (error) {
                    console.warn("Failed to get both audio and video, trying fallback...", error);
                    
                    // Fallback: try only what is absolutely necessary
                    if (mediaPreferences.videoEnabled && mediaPreferences.audioEnabled) {
                        try {
                            // Try audio only if video failed
                            stream = await navigator.mediaDevices.getUserMedia({ 
                                audio: mediaPreferences.audioDeviceId ? { deviceId: { ideal: mediaPreferences.audioDeviceId } } : true 
                            });
                        } catch (audioError) {
                            console.error("Fallback to audio also failed:", audioError);
                        }
                    }
                }

                if (cancelled) {
                    stream?.getTracks().forEach(track => track.stop());
                    return;
                }

                setPreviewStream(stream);

                if (videoRef.current && mediaPreferences.videoEnabled) {
                    videoRef.current.srcObject = stream;
                }

                const audioTrack = stream?.getAudioTracks()[0];
                if (audioTrack && mediaPreferences.audioEnabled) {
                    audioContext = new AudioContext();
                    const analyser = audioContext.createAnalyser();
                    analyser.fftSize = 128;
                    const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]));
                    const data = new Uint8Array(analyser.frequencyBinCount);
                    source.connect(analyser);

                    const updateLevel = () => {
                        if (cancelled) return;
                        analyser.getByteFrequencyData(data);
                        const average = data.reduce((sum, value) => sum + value, 0) / data.length;
                        setMicLevel(Math.min(1, average / 80));
                        frame = requestAnimationFrame(updateLevel);
                    };

                    updateLevel();
                }
            } catch (error) {
                console.error("Preview failed:", error);
                setMicLevel(0);
            }
        };

        void startPreview();

        return () => {
            cancelled = true;
            if (frame) cancelAnimationFrame(frame);
            void audioContext?.close();
            stream?.getTracks().forEach(track => track.stop());
            setPreviewStream(null);
        };
    }, [
        mediaPreferences.audioDeviceId,
        mediaPreferences.audioEnabled,
        mediaPreferences.videoDeviceId,
        mediaPreferences.videoEnabled,
    ]);

    const handleJoin = () => {
        onSubmit({
            username: username || "Anonymous",
            videoEnabled: mediaPreferences.videoEnabled,
            audioEnabled: mediaPreferences.audioEnabled,
            videoDeviceId: mediaPreferences.videoDeviceId,
            audioDeviceId: mediaPreferences.audioDeviceId,
        });
    };

    const [play] = useSound("https://assets.chanhdai.com/sounds/ios/unlock.mp3", {
        volume: 0.5,
    })

    return (
        <div className="flex flex-col gap-6 w-full max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Preview Container */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[2.5rem] border border-border/50 bg-card shadow-2xl group dark:bg-black/40">
                <div className="size-full bg-gradient-to-b from-neutral-400 to-neutral-600 dark:from-neutral-800 dark:to-neutral-900">
                    <AnimatePresence mode="wait">
                        {mediaPreferences.videoEnabled ? (
                            <motion.video
                                key="video"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                ref={(el) => {
                                    videoRef.current = el;
                                    if (el && previewStream) {
                                        el.srcObject = previewStream;
                                    }
                                }}
                                autoPlay
                                muted
                                playsInline
                                className="size-full object-cover mirror"
                            />
                        ) : (
                            <motion.div
                                key="no-video"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="size-full flex items-center justify-center relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
                                <Avatar className="size-24 lg:size-40 border-4 border-white/10 bg-white/5 shadow-2xl backdrop-blur-2xl">
                                    {user?.imageUrl && <AvatarImage src={user.imageUrl} alt={username} />}
                                    <AvatarFallback className="bg-transparent text-3xl lg:text-5xl font-bold text-white/90">
                                        {getInitials(username || user?.fullName || "Guest")}
                                    </AvatarFallback>
                                </Avatar>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Overlaid Controls */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 p-8 pt-24 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setMediaPreferences({ audioEnabled: !mediaPreferences.audioEnabled })}
                                    className={cn(
                                        "size-12 rounded-full transition-all duration-300",
                                        mediaPreferences.audioEnabled 
                                            ? "bg-white/10 text-white hover:bg-white/20 border border-white/10" 
                                            : "bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/30"
                                    )}
                                >
                                    {mediaPreferences.audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{mediaPreferences.audioEnabled ? "Mute" : "Unmute"}</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setMediaPreferences({ videoEnabled: !mediaPreferences.videoEnabled })}
                                    className={cn(
                                        "size-12 rounded-full transition-all duration-300",
                                        mediaPreferences.videoEnabled 
                                            ? "bg-white/10 text-white hover:bg-white/20 border border-white/10" 
                                            : "bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/30"
                                    )}
                                >
                                    {mediaPreferences.videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{mediaPreferences.videoEnabled ? "Stop Video" : "Start Video"}</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setShowSettings(!showSettings)}
                                    className={cn(
                                        "size-12 rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-all duration-300",
                                        showSettings && "bg-white/30 border-white/40"
                                    )}
                                >
                                    <Settings2 size={20} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Settings</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Settings Overlay */}
                <AnimatePresence>
                    {showSettings && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-background/80 backdrop-blur-xl dark:bg-black/80"
                        >
                            <div className="w-full max-w-sm flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-muted dark:bg-white/5">
                                            <Settings2 size={20} className="text-foreground dark:text-white" />
                                        </div>
                                        <h3 className="text-base font-bold uppercase tracking-wider text-foreground dark:text-white">Settings</h3>
                                    </div>
                                    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground/40 hover:text-foreground dark:text-white/40 dark:hover:text-white" onClick={() => setShowSettings(false)}>
                                        <X size={18} />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-muted-foreground/60">
                                            <Camera size={14} />
                                            <p className="text-[10px] font-bold uppercase tracking-wider">Camera</p>
                                        </div>
                                        <Select
                                            value={mediaPreferences.videoDeviceId || "default"}
                                            onValueChange={value => setMediaPreferences({ videoDeviceId: value === "default" ? "" : value })}
                                            disabled={!mediaPreferences.videoEnabled}
                                        >
                                            <SelectTrigger className="w-full bg-muted/50 border-border rounded-xl h-10 text-foreground text-xs dark:bg-white/5 dark:border-white/10 dark:text-white">
                                                <SelectValue placeholder="Default" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border text-popover-foreground dark:bg-zinc-900 dark:border-white/10 dark:text-white">
                                                <SelectItem value="default">System Default</SelectItem>
                                                {videoDevices.map((device, index) => (
                                                    <SelectItem key={device.deviceId} value={device.deviceId}>
                                                        {device.label || `Camera ${index + 1}`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-muted-foreground/60">
                                            <Mic size={14} />
                                            <p className="text-[10px] font-bold uppercase tracking-wider">Mic</p>
                                        </div>
                                        <Select
                                            value={mediaPreferences.audioDeviceId || "default"}
                                            onValueChange={value => setMediaPreferences({ audioDeviceId: value === "default" ? "" : value })}
                                            disabled={!mediaPreferences.audioEnabled}
                                        >
                                            <SelectTrigger className="w-full bg-muted/50 border-border rounded-xl h-10 text-foreground text-xs dark:bg-white/5 dark:border-white/10 dark:text-white">
                                                <SelectValue placeholder="Default" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border text-popover-foreground dark:bg-zinc-900 dark:border-white/10 dark:text-white">
                                                <SelectItem value="default">System Default</SelectItem>
                                                {audioDevices.map((device, index) => (
                                                    <SelectItem key={device.deviceId} value={device.deviceId}>
                                                        {device.label || `Mic ${index + 1}`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Info Bar */}
            <div className="w-full px-2">
                <SlideToUnlock onUnlock={handleJoin} className="w-full">
                    <SlideToUnlockTrack>
                        <SlideToUnlockHandle />
                        <SlideToUnlockText>
                            {({ isDragging }) => (
                                <span>{isDragging ? "RELEASE" : "SLIDE TO JOIN"}</span>
                            )}
                        </SlideToUnlockText>
                    </SlideToUnlockTrack>
                </SlideToUnlock>
            </div>
        </div>
    );
}
