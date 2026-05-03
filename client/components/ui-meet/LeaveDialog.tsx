"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PhoneOff, LogOut, X } from "lucide-react";
import GlassSurface from "@/components/GlassSurface";

interface LeaveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLeave: () => void;
    onEndMeeting: () => void;
    isHost: boolean;
}

/* ── Variants ── */
const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.88, y: 24 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: "spring" as const, damping: 26, stiffness: 360, mass: 0.9 },
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        y: 16,
        transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const },
    },
};

const containerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.07, delayChildren: 0.12 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring" as const, damping: 22, stiffness: 300 },
    },
};

const iconRingVariants = {
    idle: { scale: 1, boxShadow: "0 0 0 0px rgba(239,68,68,0)" },
    pulse: {
        scale: [1, 1.06, 1],
        boxShadow: [
            "0 0 0 0px rgba(239,68,68,0)",
            "0 0 0 10px rgba(239,68,68,0.14)",
            "0 0 0 0px rgba(239,68,68,0)",
        ],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut" as const,
        },
    },
};

export default function LeaveDialog({
    open,
    onOpenChange,
    onLeave,
    onEndMeeting,
    isHost,
}: LeaveDialogProps) {
    const close = () => onOpenChange(false);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* ── Backdrop ── */}
                    <motion.div
                        key="leave-backdrop"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        onClick={close}
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                        aria-hidden="true"
                    />

                    {/* ── Modal ── */}
                    <motion.div
                        key="leave-modal"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed inset-0 z-[61] flex items-center justify-center pointer-events-none px-4"
                    >
                        <GlassSurface
                            borderRadius={24}
                            width="100%"
                            height="auto"
                            backgroundOpacity={0.08}
                            blur={40}
                            className="pointer-events-auto max-w-sm w-full border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.6)]"
                            contentClassName="p-0"
                        >
                            {/* Close button */}
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                onClick={close}
                                aria-label="Close dialog"
                                className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-colors z-10"
                            >
                                <X className="size-4" />
                            </motion.button>

                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="flex flex-col items-center p-8 pt-10 text-center relative"
                            >
                                {/* Pulsing icon ring */}
                                <motion.div
                                    variants={itemVariants}
                                    className="mb-6"
                                >
                                    <motion.div
                                        variants={iconRingVariants}
                                        initial="idle"
                                        animate="pulse"
                                        className="flex size-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20"
                                    >
                                        <PhoneOff className="size-7 text-red-400" />
                                    </motion.div>
                                </motion.div>

                                {/* Title */}
                                <motion.h2
                                    variants={itemVariants}
                                    className="text-xl font-bold text-white mb-2 tracking-tight"
                                >
                                    {isHost ? "End or Leave?" : "Leave meeting?"}
                                </motion.h2>

                                {/* Subtitle */}
                                <motion.p
                                    variants={itemVariants}
                                    className="text-sm text-white/50 mb-8 leading-relaxed max-w-[260px]"
                                >
                                    {isHost
                                        ? "You can leave while keeping the meeting active, or end it for everyone."
                                        : "You'll be disconnected from the meeting. Others will remain."}
                                </motion.p>

                                {/* Buttons */}
                                <motion.div
                                    variants={itemVariants}
                                    className="flex w-full flex-col gap-3"
                                >
                                    {/* Leave (always shown) */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                        onClick={() => { onLeave(); close(); }}
                                        id="leave-meeting-confirm-btn"
                                        className="w-full h-12 rounded-xl bg-red-500 text-white font-semibold text-sm tracking-wide hover:bg-red-600 transition-colors flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(239,68,68,0.35)]"
                                    >
                                        <PhoneOff className="size-4" />
                                        Leave meeting
                                    </motion.button>

                                    {/* End for everyone (host only) */}
                                    {isHost && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.97 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                            onClick={() => { onEndMeeting(); close(); }}
                                            id="end-meeting-confirm-btn"
                                            className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white/80 font-semibold text-sm tracking-wide hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all flex items-center justify-center gap-2"
                                        >
                                            <LogOut className="size-4" />
                                            End for everyone
                                        </motion.button>
                                    )}

                                    {/* Cancel */}
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                        onClick={close}
                                        id="leave-meeting-cancel-btn"
                                        className="w-full h-11 rounded-xl text-white/40 text-sm font-medium hover:text-white/70 hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </motion.button>
                                </motion.div>
                            </motion.div>
                        </GlassSurface>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}