'use client'

import {SignIn} from "@clerk/nextjs";
import { Particles } from "@/components/ui/particles";
import {motion} from "framer-motion";

const fadeUp = {
    hidden: {opacity: 0, y: 24},
    show: {opacity: 1, y: 0, transition: {duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const}},
};

export default function Page() {
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

            <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="relative flex min-h-screen flex-col items-center justify-center px-4 py-20"
            >
                <SignIn />
            </motion.div>
        </div>
    )
}