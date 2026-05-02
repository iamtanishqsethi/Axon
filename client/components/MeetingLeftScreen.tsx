"use client"

import {useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Home, LogOut} from "lucide-react";
import {Button} from "@/components/ui/button";
import GlassSurface from "@/components/GlassSurface";
import { Particles } from "@/components/ui/particles";
import {motion} from "framer-motion";
import {AnimatedCircularProgressBar} from "@/components/ui/animated-circular-progress-bar";

interface MeetingLeftScreenProps {
    message?: string;
    redirectAfterSeconds?: number;
}

const fadeUp = {
    hidden: {opacity: 0, y: 24},
    show: {opacity: 1, y: 0, transition: {duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const}},
};

export default function MeetingLeftScreen({
    message = "You have successfully left the meeting.",
    redirectAfterSeconds = 8,
}: MeetingLeftScreenProps) {
    const router = useRouter();
    const [secondsLeft, setSecondsLeft] = useState(redirectAfterSeconds);

    useEffect(() => {
        setSecondsLeft(redirectAfterSeconds);
    }, [redirectAfterSeconds]);

    useEffect(() => {
        if (secondsLeft <= 0) {
            router.replace("/");
            return;
        }

        const timerId = window.setTimeout(() => {
            setSecondsLeft((current) => Math.max(current - 1, 0));
        }, 1000);

        return () => window.clearTimeout(timerId);
    }, [redirectAfterSeconds, router, secondsLeft]);

    const progress = useMemo(() => {
        if (redirectAfterSeconds <= 0) {
            return 100;
        }

        return ((redirectAfterSeconds - secondsLeft) / redirectAfterSeconds) * 100;
    }, [redirectAfterSeconds, secondsLeft]);

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-20">
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <Particles
                    className="absolute inset-0 z-0 h-full w-full"
                    quantity={100}
                    ease={80}
                    color={"#ffffff"}
                    refresh
                />
            </div>
            
            <motion.section
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="relative flex w-full max-w-lg flex-col items-center gap-10 p-8"
            >
                <div className="flex flex-col items-center gap-6 text-center">
                    <GlassSurface
                        borderRadius={999}
                        width={72}
                        height={72}
                        backgroundOpacity={0.15}
                        blur={30}
                        className="border border-border/50 dark:border-white/5"
                        contentClassName="flex items-center justify-center"
                    >
                        <LogOut className="size-8 text-muted-foreground" />
                    </GlassSurface>
                    
                    <div className="flex flex-col gap-3">
                        <h1 className="text-3xl font-bold tracking-tight uppercase text-foreground">
                            You left the meeting
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {message} You will return home automatically.
                        </p>
                    </div>
                </div>

                <div className="flex w-full flex-col items-center gap-6">
                    <div className="flex items-center gap-5">
                        <AnimatedCircularProgressBar
                            max={100}
                            min={0}
                            value={progress}
                            gaugePrimaryColor="var(--primary)"
                            gaugeSecondaryColor="var(--muted)"
                            className="size-20 text-sm font-bold"
                        >
                            {secondsLeft}
                        </AnimatedCircularProgressBar>
                        <div className="flex flex-col gap-1">
                            <p className="font-medium text-foreground">Redirecting to home</p>
                            <p className="text-xs text-muted-foreground">
                                {secondsLeft === 1 ? "1 second left" : `${secondsLeft} seconds left`}
                            </p>
                        </div>
                    </div>

                    <Button asChild className="w-full h-12 rounded-full">
                        <Link href="/">
                            <Home size={18} className="mr-2" />
                            Go now
                        </Link>
                    </Button>
                </div>
            </motion.section>
        </main>
    );
}
