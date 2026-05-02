"use client";

import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import React, { useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Project interface for the card stack
 */
export interface CardProject {
  title: string;
  src: string;
  description?: string;
  color?: string;
}

/**
 * Default projects for demo purposes
 */
const defaultProjects: CardProject[] = [
  {
    title: "HD Video Calling",
    src: "/images/features/hd-video.png",
    description: "High-fidelity video and audio for seamless collaboration.",
  },
  {
    title: "Collaborative Whiteboard",
    src: "/images/features/whiteboard.png",
    description: "Brainstorm and visualize ideas together in real-time.",
  },
  {
    title: "Pair Programming",
    src: "/images/features/code-editor.png",
    description: "Real-time collaborative code editor for technical teams.",
  },
  {
    title: "Team Alignment",
    src: "/images/features/hd-video.png",
    description: "Keep your team synchronized with focused rooms.",
  },
  {
    title: "Shared Context",
    src: "/images/features/whiteboard.png",
    description: "Maintain project state and context across meetings.",
  },
];

interface StickyCardProps extends CardProject {
  i: number;
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
  cardClassName?: string;
}

/**
 * Individual sticky card component with scroll-driven scale animation
 */
const StickyCard_001 = ({
  i,
  title,
  src,
  description,
  progress,
  range,
  targetScale,
  cardClassName,
}: StickyCardProps) => {
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    <motion.div
      style={{
        scale,
        top: `calc(10vh + ${i * 25}px)`,
      }}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[2rem] border bg-card shadow-2xl origin-top",
        "h-[400px] w-[90%] max-w-[600px] md:h-[500px] md:w-[800px]",
        cardClassName
      )}
    >
      <div className="relative h-full w-full">
        <Image
          src={src}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 90vw, (max-width: 1200px) 80vw, 800px"
          priority={i === 0}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 text-white">
          <h3 className="text-2xl md:text-3xl font-bold">{title}</h3>
          {description && (
            <p className="mt-2 text-sm md:text-base text-white/80 max-w-md">
              {description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export interface Skiper16Props {
  projects?: CardProject[];
  className?: string;
  cardClassName?: string;
  showScrollMessage?: boolean;
}

/**
 * Skiper16 Scroll-based Animated Card Stack
 * 
 * @param projects - Array of project objects to display
 * @param className - Additional classes for the main container
 * @param cardClassName - Additional classes for the individual cards
 * @param showScrollMessage - Whether to show the "scroll down" indicator
 */
const Skiper16 = ({
  projects = defaultProjects,
  className,
  cardClassName,
  showScrollMessage = true,
}: Skiper16Props) => {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <main
      ref={container}
      className={cn(
        "relative w-full",
        className
      )}
      style={{ height: `${projects.length * 100}vh` }}
    >
      {showScrollMessage && (
        <motion.div 
          style={{ opacity: useTransform(scrollYProgress, [0, 0.05], [1, 0]) }}
          className="sticky top-0 left-0 w-full h-0 flex justify-center z-[100]"
        >
          <div className="mt-[15vh] grid content-start justify-items-center gap-6 text-center">
            <span className="after:from-background after:to-foreground relative max-w-[15ch] text-xs uppercase tracking-widest leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-12 after:w-px after:bg-gradient-to-b after:content-['']">
              scroll down to explore features
            </span>
          </div>
        </motion.div>
      )}
      <div className="w-full flex flex-col items-center">
        {projects.map((project, i) => {
          const targetScale = Math.max(0.6, 1 - (projects.length - i - 1) * 0.05);
          
          // Range calculation: 
          // Card starts scaling when it reaches the top
          const rangeStart = (i / projects.length);
          const rangeEnd = 1;

          return (
            <div 
              key={`${project.title}_${i}`}
              className="w-full sticky top-0 h-screen flex items-center justify-center"
              style={{ zIndex: i }}
            >
              <StickyCard_001
                i={i}
                {...project}
                progress={scrollYProgress}
                range={[rangeStart, rangeEnd]}
                targetScale={targetScale}
                cardClassName={cardClassName}
              />
            </div>
          );
        })}
      </div>
    </main>
  );
};

export { Skiper16, StickyCard_001 };
