'use client';

import { useState, type FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from "@/lib/utils";

export interface InlineCopyToastProps {
  code: string;
  copyDuration?: number;
  className?: string;
}

export const InlineToast: FC<InlineCopyToastProps> = ({
  code,
  copyDuration = 2000,
  className,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText('https://axon.iamtanishqsethi.com/meeting/' + code);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, copyDuration);
  };

  return (
    <motion.div
      layout="position"
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className={cn("relative flex h-10 min-w-[200px] items-center justify-center overflow-hidden rounded-full px-4 py-1", className)}
    >
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{
              duration: copyDuration / 1000,
              ease: 'linear',
            }}
            className="absolute inset-0 bg-[#F0F0F0] dark:bg-zinc-800"
          />
        )}
      </AnimatePresence>

      <div className="z-10 flex w-full items-center justify-between gap-7">
        <AnimatePresence mode="popLayout">
          {!copied ? (
            <motion.div
              key="copy"
              initial={{ opacity: 0, filter: 'blur(4px)', scale: 0.95 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
              exit={{ opacity: 0, filter: 'blur(4px)', scale: 0.95 }}
              transition={{
                type: 'spring',
                bounce: 0,
                duration: 0.4,
              }}
              className="flex w-full items-center justify-between"
            >
              <span className="text-sm font-bold tracking-tight text-foreground/70 dark:text-white/70">
                {code}
              </span>

              <motion.button
                onClick={handleCopy}
                whileHover={{ y: -1, scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={{
                  type: 'spring',
                  stiffness: 350,
                  damping: 18,
                }}
                className="relative cursor-pointer overflow-hidden rounded-full bg-muted px-3 py-1 text-xs font-bold text-foreground shadow-sm hover:bg-muted/80 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                <motion.span
                  initial={{ x: '-120%' }}
                  whileHover={{ x: '120%' }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className="pointer-events-none absolute inset-0 bg-linear-to-r from-transparent via-black/5 to-transparent"
                />

                <span className="relative z-10">Copy</span>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="copied"
              initial={{ opacity: 0, filter: 'blur(4px)', scale: 1.1 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
              exit={{ opacity: 0, filter: 'blur(4px)', scale: 1.1 }}
              transition={{
                type: 'spring',
                bounce: 0,
                duration: 0.4,
              }}
              className="flex w-full items-center justify-center gap-2 text-primary dark:text-white"
            >
              <CheckCircle2 size={16} />
              <span className="text-xs font-bold text-primary dark:text-white">Copied!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
