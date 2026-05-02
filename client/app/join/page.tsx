'use client'

import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {useMeetingStore} from '@/store/meetingStore';
import { LogIn, Sparkles, } from 'lucide-react';
import {motion} from 'framer-motion';
import { Particles } from "@/components/ui/particles";
import {AnimatedShinyText} from "@/components/ui/animated-shiny-text";
import {cn} from "@/lib/utils";
import {FloatingInput} from "@/components/ui/floating-input";
import CustomPreJoin from '@/components/CustomPreJoin';
import {toast} from "sonner";
import {Spinner} from "@/components/kibo-ui/spinner";
import {joinMeeting} from "@/services/api";

const fadeUp = {
    hidden: {opacity: 0, y: 24},
    show: {opacity: 1, y: 0, transition: {duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const}},
};

export default function JoinMeetingPage() {
    const router = useRouter();
    const [meetingId, setMeetingId] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const setMediaPreferences = useMeetingStore(state => state.setMediaPreferences);

    const handlePreJoinSubmit = async (values: {
        username: string;
        videoEnabled: boolean;
        audioEnabled: boolean;
        videoDeviceId: string;
        audioDeviceId: string;
    }) => {
        if (!meetingId.trim()) {
            toast.error("Please enter a meeting ID");
            return;
        }
        
        setIsJoining(true);
        try {
            // Check if meeting exists and is joinable
            await joinMeeting(meetingId.trim());
            
            setMediaPreferences(values);
            router.push(`/meeting/${meetingId.trim()}`);
        } catch (error: any) {
            console.error('Join error:', error);
            const message = error.response?.data?.error || "Failed to join meeting. Please check the ID.";
            toast.error(message);
            setIsJoining(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-background">
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <Particles
                    className="absolute inset-0 z-0 h-full w-full"
                    quantity={100}
                    ease={80}
                    color={"#ffffff"}
                    refresh
                />
            </div>

            <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">
                {isJoining ? (
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        className={'flex flex-col items-center justify-center gap-4'}
                    >
                        <Spinner variant={'bars'} size={40} />
                        <div className="text-center">
                            <h2 className="text-2xl font-bold tracking-wide uppercase">Connecting</h2>
                            <p className="text-muted-foreground mt-2 text-sm">Joining your secure room...</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.section
                        variants={fadeUp}
                        initial="hidden"
                        animate="show"
                        className="w-full max-w-6xl"
                    >
                        <div className="grid gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-[1fr_1.2fr] lg:items-stretch">
                            <div className="flex flex-col gap-6 lg:gap-8 justify-center order-1">
                                <div className="flex flex-col gap-4 lg:gap-6">
                                    <motion.div variants={fadeUp}>
                                        <div
                                            className={cn(
                                                "group w-fit rounded-full border border-black/5 bg-neutral-100/50 text-base text-white transition-all ease-in-out dark:border-white/5 dark:bg-neutral-900/50"
                                            )}
                                        >
                                            <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-in-out">
                                                <LogIn size={16} className={'mr-2'}/> Join meeting
                                            </AnimatedShinyText>
                                        </div>
                                    </motion.div>

                                    <div className="flex flex-col gap-3 lg:gap-4">
                                        <h1 className="text-balance text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight uppercase">
                                            Enter the room code
                                        </h1>
                                        <p className="hidden md:block max-w-xl text-base leading-relaxed text-muted-foreground lg:text-lg">
                                            Paste the meeting ID from the host, then continue to camera and microphone setup.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <FloatingInput
                                        label={'Meeting ID'}
                                        value={meetingId}
                                        onChange={(e) => setMeetingId(e.target.value)}
                                        className="h-12 bg-background/50 border-white/10 text-lg font-mono tracking-widest rounded-full uppercase"
                                    />
                                    
                                    {meetingId.trim() && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-2 text-primary/80 px-4"
                                        >
                                            <Sparkles size={14} />
                                            <span className="text-xs font-bold uppercase tracking-widest">Ready to connect</span>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-center w-full max-w-xl mx-auto lg:mx-0 order-2 mb-4 lg:mb-0">
                                <CustomPreJoin
                                    onSubmit={handlePreJoinSubmit}
                                />
                            </div>
                        </div>
                    </motion.section>
                )}
            </div>
        </div>
    );
}
