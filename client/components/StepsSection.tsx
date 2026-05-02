"use client";

import React from "react";
import { motion } from "framer-motion";
import { Video, Code2, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedContent from "./AnimatedContent";
import { LampContainer } from "./ui/lamp";
import { AnimatedShinyText } from "./ui/animated-shiny-text";
import { LayersIcon } from "lucide-react";
import { MagicCard } from "./ui/magic-card";
import { useTheme } from "next-themes";

const steps = [
  {
    title: "Start a Session",
    description: "Launch a high-fidelity video meeting instantly with a single click. No complex setup required.",
    icon: Video,
    stepNumber: 1,
  },
  {
    title: "Code & Collaborate",
    description: "Use integrated whiteboards and a real-time code editor to build and brainstorm together.",
    icon: Code2,
    stepNumber: 2,
  },
  {
    title: "Build Faster",
    description: "Streamline your development workflow with tools designed specifically for technical teams.",
    icon: Rocket,
    stepNumber: 3,
  },
];

export function StepsSection() {
  const theme = useTheme();
    return (
    <section className="relative w-full pt-4" >
      <LampContainer className="">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ">
          <div className="text-center pt-58 mt-12 mb-24 flex flex-col items-center justify-center ">
            
            <AnimatedContent distance={40} delay={0.1} threshold={0}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground uppercase ">
                Get started in <span className="text-primary">3 simple steps</span>
              </h2>
            </AnimatedContent>
            <AnimatedContent distance={40} delay={0.2} threshold={0}>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Experience the next level of developer collaboration with Axon's streamlined workflow.
              </p>
            </AnimatedContent>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {steps.map((step, index) => (
              <AnimatedContent
                key={step.title}
                distance={60}
                delay={0.1 + index * 0.1}
                threshold={0}
                className="h-full "
              >
                <MagicCard
        gradientColor={ "#262626"}
        className="p-0 rounded-[2rem] "
      >
                <div
                  className={cn(
                    "group relative flex flex-col h-full items-start p-8 rounded-[2rem] border bg-zinc-950/40 border-zinc-800/50 backdrop-blur-md hover:border-primary/40 transition-all duration-500",
                    "hover:shadow-[0_0_40px_-15px_rgba(var(--primary),0.3)]"
                  )}
                >
                  <div className="flex w-full items-start justify-between mb-8">
                    <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 text-primary/80 group-hover:text-primary transition-colors duration-500">
                      <step.icon size={28} strokeWidth={1.5} />
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800/50 text-sm font-semibold text-muted-foreground/60 group-hover:text-primary group-hover:border-primary/40 transition-all duration-500">
                      {step.stepNumber}
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-500 uppercase tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground/80 leading-relaxed text-[17px]">
                    {step.description}
                  </p>

                  {/* Decorative gradient corner */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
                </MagicCard>
              </AnimatedContent>
            ))}
          </div>
        </div>
      </LampContainer>
    </section>
  );
}
