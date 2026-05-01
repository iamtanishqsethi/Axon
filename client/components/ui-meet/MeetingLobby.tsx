"use client";

import {Camera, Mic, VideoOff, Settings2, MicOff, Video, X, LogOut} from "lucide-react";
import {useEffect, useRef, useState} from "react";
import {useMeetingStore} from "@/store/meetingStore";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {useUser} from "@clerk/nextjs";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";
import {leaveMeeting} from "@/services/api";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {Switch} from "@/components/ui/switch";
import {motion, AnimatePresence} from "framer-motion";
import {Spinner} from "@/components/kibo-ui/spinner";
import GlassSurface from "@/components/GlassSurface";
import {AnimatedShinyText} from "@/components/ui/animated-shiny-text";
import {cn} from "@/lib/utils";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {RecordPlayer} from "@/components/RecordPlayer";
import {FloatingDock} from "@/components/ui/floating-dock";

const fadeUp = {
    hidden: {opacity: 0, y: 24},
    show: {opacity: 1, y: 0, transition: {duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const}},
};

interface MeetingLobbyProps {
    meetingId: string;
}

export default function MeetingLobby({meetingId}: MeetingLobbyProps) {
    const {user} = useUser();
    const mediaPreferences = useMeetingStore(state => state.mediaPreferences);
    const setMediaPreferences = useMeetingStore(state => state.setMediaPreferences);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [micLevel, setMicLevel] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const router = useRouter();
    
    const videoDevices = devices.filter(device => device.kind === "videoinput");
    const audioDevices = devices.filter(device => device.kind === "audioinput");

    useEffect(() => {
        if (!navigator.mediaDevices?.enumerateDevices) return;

        const loadDevices = async () => {
            const nextDevices = await navigator.mediaDevices.enumerateDevices();
            setDevices(nextDevices);
        };

        void loadDevices();
        navigator.mediaDevices.addEventListener?.("devicechange", loadDevices);
        return () => navigator.mediaDevices.removeEventListener?.("devicechange", loadDevices);
    }, []);

    useEffect(() => {
        if (!navigator.mediaDevices?.getUserMedia) return;
        if (!mediaPreferences.videoEnabled && !mediaPreferences.audioEnabled) {
            if (videoRef.current) videoRef.current.srcObject = null;
            queueMicrotask(() => setMicLevel(0));
            return;
        }

        let cancelled = false;
        let stream: MediaStream | null = null;
        let frame = 0;
        let audioContext: AudioContext | null = null;

        const startPreview = async () => {
            try {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: mediaPreferences.videoEnabled
                            ? {
                                deviceId: mediaPreferences.videoDeviceId || undefined,
                            }
                            : false,
                        audio: mediaPreferences.audioEnabled
                            ? {
                                deviceId: mediaPreferences.audioDeviceId || undefined,
                            }
                            : false,
                    });
                } catch (error) {
                    console.warn("Lobby preview failed, trying fallback...", error);
                    if (mediaPreferences.videoEnabled && mediaPreferences.audioEnabled) {
                        try {
                            stream = await navigator.mediaDevices.getUserMedia({ 
                                audio: mediaPreferences.audioDeviceId ? { deviceId: mediaPreferences.audioDeviceId } : true 
                            });
                        } catch (audioError) {
                            console.error("Lobby fallback failed:", audioError);
                        }
                    }
                }

                if (cancelled) {
                    stream?.getTracks().forEach(track => track.stop());
                    return;
                }

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

                const audioTrack = stream?.getAudioTracks()[0];
                if (audioTrack) {
                    audioContext = new AudioContext();
                    const analyser = audioContext.createAnalyser();
                    analyser.fftSize = 128;
                    const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]));
                    const data = new Uint8Array(analyser.frequencyBinCount);
                    source.connect(analyser);

                    const updateLevel = () => {
                        analyser.getByteFrequencyData(data);
                        const average = data.reduce((sum, value) => sum + value, 0) / data.length;
                        setMicLevel(Math.min(1, average / 90));
                        frame = requestAnimationFrame(updateLevel);
                    };

                    updateLevel();
                }
            } catch (error) {
                console.error(error);
                setMicLevel(0);
            }
        };

        void startPreview();

        return () => {
            cancelled = true;
            if (frame) cancelAnimationFrame(frame);
            void audioContext?.close();
            stream?.getTracks().forEach(track => track.stop());
        };
    }, [
        mediaPreferences.audioDeviceId,
        mediaPreferences.audioEnabled,
        mediaPreferences.videoDeviceId,
        mediaPreferences.videoEnabled,
    ]);

    return (
        <div className="relative min-h-screen overflow-hidden bg-background">
            <div
                className="pointer-events-none absolute inset-0 z-0 h-screen"
                style={{
                    maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                }}
            >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-muted via-background to-background dark:from-zinc-800 dark:via-zinc-950 dark:to-black" />
            </div>

<div className="relative flex min-h-screen items-center justify-center p-4 md:p-8 lg:p-12">
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    className="w-full max-w-7xl flex flex-col gap-8 lg:gap-12"
                >
                    {/* Header */}
                    <div className="flex flex-col gap-3 text-center lg:text-left items-center lg:items-start">
                        <motion.div variants={fadeUp}>
                            <div className="group w-fit rounded-full border border-border/50 bg-muted/50 px-4 py-1 dark:bg-neutral-900/50">
                                <AnimatedShinyText className="inline-flex items-center justify-center text-xs font-bold uppercase tracking-[0.2em]">
                                    <Spinner variant={'bars'} size={16} className={'mr-2'}/>  Waiting for host...
                                </AnimatedShinyText>
                            </div>
                        </motion.div>
                        <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight font-(family-name:--font-share-tech) uppercase text-foreground/90">
                            Set up your space
                        </h1>
                    </div>

                    {/* Main Side by Side Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12 items-center">
                        
                        {/* Left: User Preview & Controls */}
                        <div className="flex flex-col gap-6 lg:gap-8 w-full justify-self-center max-w-2xl">
                            <div className="relative aspect-video w-full overflow-hidden rounded-[1.5rem] lg:rounded-[2.5rem] border border-border/50 bg-card shadow-2xl group dark:bg-black/40">
                                <div className="size-full bg-muted/20 dark:bg-zinc-900/40">
                                    {mediaPreferences.videoEnabled ? (
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex size-full items-center justify-center bg-zinc-900/60 backdrop-blur-2xl">
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.03)_0%,transparent_70%)]" />
                                            <Avatar className="size-20 lg:size-40 border-4 border-border/20 bg-muted/50 shadow-2xl backdrop-blur-3xl dark:border-white/5 dark:bg-white/5">
                                                {user?.imageUrl && <AvatarImage src={user.imageUrl} />}
                                                <AvatarFallback className="bg-transparent text-3xl lg:text-5xl font-bold text-foreground/80 dark:text-white/80">
                                                    {user?.firstName ? user.firstName.slice(0, 2).toUpperCase() : "CB"}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                    )}
                                </div>

                                {/* Bottom Controls - Floating Dock Style */}
                                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center p-4 lg:p-8 pt-16 lg:pt-24 bg-gradient-to-t from-background/90 via-background/40 to-transparent dark:from-black/90 dark:via-black/40">
                                    <FloatingDock
                                        items={[
                                            {
                                                title: mediaPreferences.audioEnabled ? "Mute" : "Unmute",
                                                icon: mediaPreferences.audioEnabled ? <Mic size={20} /> : <MicOff size={20} />,
                                                onClick: () => setMediaPreferences({audioEnabled: !mediaPreferences.audioEnabled}),
                                                className: cn(!mediaPreferences.audioEnabled && "!bg-red-500/20 !text-red-400 !border-red-500/30"),
                                            },
                                            {
                                                title: mediaPreferences.videoEnabled ? "Stop Video" : "Start Video",
                                                icon: mediaPreferences.videoEnabled ? <Video size={20} /> : <VideoOff size={20} />,
                                                onClick: () => setMediaPreferences({videoEnabled: !mediaPreferences.videoEnabled}),
                                                className: cn(!mediaPreferences.videoEnabled && "!bg-red-500/20 !text-red-400 !border-red-500/30"),
                                            },
                                            {
                                                title: "Settings",
                                                icon: <Settings2 size={20} />,
                                                onClick: () => setShowSettings(!showSettings),
                                                className: cn(showSettings && "!bg-primary/10 !border-primary/20 dark:!bg-white/20 dark:!border-white/30"),
                                            },
                                        ]}
                                        desktopClassName="bg-transparent border-none backdrop-blur-0 shadow-none"
                                        mobileClassName="bg-transparent border-none backdrop-blur-0 shadow-none"
                                    />
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
                                                            onValueChange={value => setMediaPreferences({videoDeviceId: value === "default" ? "" : value})}
                                                            disabled={!mediaPreferences.videoEnabled}
                                                        >
                                                            <SelectTrigger className="w-full bg-muted/50 border-border rounded-xl h-10 text-foreground text-xs dark:bg-white/5 dark:border-white/10 dark:text-white">
                                                                <SelectValue placeholder="Default" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-popover border-border text-popover-foreground dark:bg-zinc-900 dark:border-white/10 dark:text-white">
                                                                <SelectGroup>
                                                                    <SelectItem value="default">System Default</SelectItem>
                                                                    {videoDevices.map((device, index) => (
                                                                        <SelectItem key={device.deviceId} value={device.deviceId}>
                                                                            {device.label || `Camera ${index + 1}`}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectGroup>
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
                                                            onValueChange={value => setMediaPreferences({audioDeviceId: value === "default" ? "" : value})}
                                                            disabled={!mediaPreferences.audioEnabled}
                                                        >
                                                            <SelectTrigger className="w-full bg-muted/50 border-border rounded-xl h-10 text-foreground text-xs dark:bg-white/5 dark:border-white/10 dark:text-white">
                                                                <SelectValue placeholder="Default" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-popover border-border text-popover-foreground dark:bg-zinc-900 dark:border-white/10 dark:text-white">
                                                                <SelectGroup>
                                                                    <SelectItem value="default">System Default</SelectItem>
                                                                    {audioDevices.map((device, index) => (
                                                                        <SelectItem key={device.deviceId} value={device.deviceId}>
                                                                            {device.label || `Mic ${index + 1}`}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectGroup>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>


                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            
                            {/* Joining Status & Actions */}
                            <div className="flex items-center justify-between w-full p-4 lg:p-5 rounded-2xl bg-card border border-border/50 shadow-lg backdrop-blur-sm dark:bg-white/5 dark:border-white/10">
                                <div className="flex flex-col gap-1 text-left">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60 dark:text-white/40">Secured Meeting ID</p>
                                    <code className="text-sm font-mono tracking-widest text-foreground/80 dark:text-white/80">{meetingId}</code>
                                </div>
                                <Button 
                                    variant="destructive" 
                                    className="rounded-xl px-4 lg:px-6 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 shadow-none transition-all"
                                    disabled={isLeaving}
                                    onClick={async () => {
                                        try {
                                            setIsLeaving(true);
                                            await leaveMeeting(meetingId);
                                            router.push('/');
                                        } catch (error) {
                                            console.error("Failed to leave meeting:", error);
                                            router.push('/');
                                        }
                                    }}
                                >
                                    {isLeaving ? <Spinner variant={'bars'} size={16} className="lg:mr-2" /> : <LogOut size={16} className="lg:mr-2" />}
                                    <span className="hidden lg:inline font-bold uppercase tracking-wider text-xs">
                                        {isLeaving ? "Exiting..." : "Exit"}
                                    </span>
                                </Button>
                            </div>
                        </div>

                        {/* Right: Record Player / Elevator Vibe */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center justify-center w-full mt-4 lg:mt-0"
                        >
                            <RecordPlayer 
                                isPlaying={isMusicPlaying} 
                                onToggle={() => setIsMusicPlaying(!isMusicPlaying)} 
                            />
                        </motion.div>

                    </div>
                </motion.div>
            </div>
        </div>
    );
}
