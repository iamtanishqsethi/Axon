"use client"

import Link from "next/link";
import {Home, ShieldX, AlertCircle} from "lucide-react";
import {Button} from "@/components/ui/button";
import GlassSurface from "@/components/GlassSurface";
import { Particles } from "@/components/ui/particles";
import {motion} from "framer-motion";

interface MeetingErrorScreenProps {
    title?: string;
    message?: string;
    type?: "rejected" | "error";
}

const fadeUp = {
    hidden: {opacity: 0, y: 24},
    show: {opacity: 1, y: 0, transition: {duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const}},
};

export default function MeetingErrorScreen({
    title = "Unable to join",
    message = "An unexpected error occurred.",
    type = "error"
}: MeetingErrorScreenProps) {
    const isRejected = type === "rejected";

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
                        backgroundOpacity={isRejected ? 0.05 : 0.05}
                        blur={30}
                        className={isRejected ? "border border-destructive/20" : "border border-border/50 dark:border-white/5"}
                        contentClassName="flex items-center justify-center"
                    >
                        {isRejected ? (
                            <ShieldX className="size-8 text-destructive" />
                        ) : (
                            <AlertCircle className="size-8 text-muted-foreground" />
                        )}
                    </GlassSurface>
                    
                    <div className="flex flex-col gap-3">
                        <h1 className="text-3xl font-bold tracking-tight uppercase text-foreground">
                            {title}
                        </h1>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="flex w-full flex-col items-center gap-6">
                    <Button asChild className="w-full h-12 rounded-xl" variant={isRejected ? "destructive" : "default"}>
                        <Link href="/">
                            <Home size={18} className="mr-2" />
                            Back to Home
                        </Link>
                    </Button>
                </div>
            </motion.section>
        </main>
    );
}
