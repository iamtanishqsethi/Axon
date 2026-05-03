'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

export function LoadingScreen() {
    const [isVisible, setIsVisible] = useState(false)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        // Only show the loading screen on the very first visit per session
        const hasLoaded = sessionStorage.getItem('axon_has_loaded')
        if (hasLoaded) return

        // Mark as loaded immediately so navigating back won't show it again
        sessionStorage.setItem('axon_has_loaded', '1')
        setIsVisible(true)

        // Animate progress bar over the loading duration
        const startTime = Date.now()
        const duration = 2000

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime
            const pct = Math.min((elapsed / duration) * 100, 100)
            setProgress(pct)
            if (pct >= 100) clearInterval(interval)
        }, 16)

        const timer = setTimeout(() => {
            setIsVisible(false)
        }, 2400)

        return () => {
            clearInterval(interval)
            clearTimeout(timer)
        }
    }, [])

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden"
                    initial={{ y: 0 }}
                    exit={{ y: '-100%' }}
                    transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
                >

                    {/* Logo + Brand */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                        className="flex flex-col items-center gap-5 select-none"
                        style={{
                            fontFamily:
                                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                        }}
                    >
                        {/* Icon */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
                            className="size-16 rounded-2xl overflow-hidden "
                        >
                            <img
                                src="/icon.png"
                                alt="Axon"
                                className="size-full object-cover"
                            />
                        </motion.div>

                        {/* Wordmark */}
                        <motion.span
                            initial={{ opacity: 0, letterSpacing: '0.3em' }}
                            animate={{ opacity: 1, letterSpacing: '0.15em' }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
                            className="text-4xl font-bold text-white uppercase"
                        >
                            AXON
                        </motion.span>

                        {/* Tagline */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.35 }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.5 }}
                            className="text-xs tracking-[0.25em] text-white uppercase"
                        >
                            Video Collaboration
                        </motion.p>
                    </motion.div>

                    {/* Progress bar — bottom of screen */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-40 h-[1px] bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-white/50 rounded-full origin-left"
                            style={{ scaleX: progress / 100 }}
                            transition={{ duration: 0.016 }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
