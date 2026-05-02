'use client'

import {useRouter} from "next/navigation";
import dynamic from "next/dynamic";
import {motion} from "framer-motion";
import AnimatedContent from "@/components/AnimatedContent";

const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-black z-0 flex items-center justify-center"></div>,
});
import CardSwap, { Card } from "@/components/CardSwap";
import { MonitorPlay, PenTool, Code2 } from "lucide-react";
import { WordRotate } from "@/components/ui/word-rotate";
import SplitButton from "@/components/ui/split-button";
import {  SiNextdotjs, SiTypescript,  SiWebrtc, SiSocketdotio, SiFramer, SiClerk, SiShadcnui } from 'react-icons/si';
import LogoLoop from '@/components/LogoLoop';
import { Skiper16 } from "@/components/ui/skiper-ui/skiper16";
import { StepsSection } from "@/components/StepsSection";
import { Safari } from "@/components/ui/safari";
import { Footer } from "@/components/Footer";
import { Backlight } from "@/components/ui/backlight";

const techLogos = [
    { node: <SiNextdotjs />, title: "Next.js", href: "https://nextjs.org" },
    { node: <SiTypescript />, title: "TypeScript", href: "https://www.typescriptlang.org" },
    { node: <SiWebrtc />, title: "WebRTC", href: "https://webrtc.org" },
    { node: <SiSocketdotio />, title: "Socket.io", href: "https://socket.io" },
    { node: <SiFramer />, title: "Framer Motion", href: "https://www.framer.com/motion/" },
    { node: <SiClerk />, title: "Clerk", href: "https://clerk.com" },
];

const TextHoverEffect = dynamic(
    () => import("@/components/ui/text-hover-effect").then((mod) => mod.TextHoverEffect),
    {
        ssr: false,
        loading: () => <div className="h-full w-full" aria-hidden="true" />,
    },
);

export default function Home() {
    const router = useRouter()

    return (
        <div className="relative min-h-screen overflow-x-clip bg-background" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>

            {/* Hero */}
            <section 
                className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center sm:px-6 overflow-hidden bg-background text-foreground"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
            >
                {/* Spline Background */}
                <div className="absolute top-0 left-1/2 w-full h-[100vh] -translate-x-[54%] md:-translate-x-[53%] -translate-y-[10%] md:-translate-y-[15%] scale-[1.75] md:scale-[2.2] z-0 [&_a]:!hidden pointer-events-none">
                    <Spline
                        scene="https://prod.spline.design/voV9nDlB8COK0k2W/scene.splinecode" 
                    />
                </div>

                {/* Hero Content Overlay */}
                <div className="relative z-10 flex flex-col items-center justify-center mt-12 sm:mt-24 pointer-events-none">
                    <AnimatedContent
                        distance={100}
                        direction="vertical"
                        reverse={false}
                        duration={0.8}
                        ease="power3.out"
                        initialOpacity={0}
                        animateOpacity
                        scale={1}
                        threshold={0}
                        delay={0.1}
                    >
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 flex flex-col items-center justify-center gap-2 text-center max-w-5xl uppercase">
                            <span>Video collaboration for</span>
                            <WordRotate className="text-primary mt-2" words={["PAIR PROGRAMMING", "REMOTE TEAMS", "WHITEBOARDING", "BRAINSTORMING"]} />
                        </h1>
                    </AnimatedContent>

                    <AnimatedContent
                        distance={100}
                        direction="vertical"
                        reverse={false}
                        duration={0.8}
                        ease="power3.out"
                        initialOpacity={0}
                        animateOpacity
                        scale={1}
                        threshold={0}
                        delay={0.2}
                    >
                        <p className="text-base sm:text-lg md:text-xl font-medium text-gray-400 max-w-[550px] mb-8 text-center leading-relaxed">
                            Seamless video meetings with ultra-low latency and real-time collaboration.
                        </p>
                    </AnimatedContent>

                    <AnimatedContent
                        distance={100}
                        direction="vertical"
                        reverse={false}
                        duration={0.8}
                        ease="power3.out"
                        initialOpacity={0}
                        animateOpacity
                        scale={1}
                        threshold={0}
                        delay={0.3}
                    >
                        <div className="pointer-events-auto">
                            <SplitButton
                                label="Get Started"
                                actions={[
                                    { label: 'New Meeting', onClick: () => router.push('/create') },
                                    { label: 'Join Meeting', onClick: () => router.push('/join') },
                                ]}
                            />
                        </div>
                    </AnimatedContent>
                </div>
            </section>

            <div className="flex items-center justify-center px-4 sm:px-12 md:px-24 lg:px-48 -mt-10 sm:-mt-28 ">
                <Backlight className="w-full" blur={40}  >
                    <Safari url="axon.iamtanishqsethi.com" 
                    imageSrc="/image.png"/>
                </Backlight>
                
            </div>




            {/* Logo Loop Section */}
            <section className="relative w-full overflow-hidden  bg-background/50 py-12 sm:py-16">
                <AnimatedContent
                    distance={50}
                    direction="vertical"
                    reverse={false}
                    duration={0.8}
                    ease="power3.out"
                    initialOpacity={0}
                    animateOpacity
                    scale={1}
                    threshold={0}
                    delay={0.1}
                >
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center">
                        <p className="text-sm font-medium text-muted-foreground mb-8 text-center uppercase tracking-widest">
                            Powered by modern technologies
                        </p>
                        <div className="w-full relative overflow-hidden" style={{ height: '60px' }}>
                            <LogoLoop
                                logos={techLogos}
                                speed={100}
                                direction="left"
                                logoHeight={40}
                                gap={60}
                                hoverSpeed={20}
                                scaleOnHover={true}
                                fadeOut={true}
                            />
                        </div>
                    </div>
                </AnimatedContent>
            </section>

            {/* Features Section */}
            <section className="relative w-full bg-background pb-36 mb-58">
                <AnimatedContent
                    distance={100}
                    direction="vertical"
                    reverse={false}
                    duration={0.8}
                    ease="power3.out"
                    initialOpacity={0}
                    animateOpacity
                    scale={1}
                    threshold={0}
                    delay={0.1}
                >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center pt-24 mb-12">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground uppercase">
                            Everything you need to build <span className="text-primary">together</span>
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            Axon combines high-fidelity video calling with powerful collaborative tools. 
                            Whether you're pair programming, brainstorming on a whiteboard, or just catching up, 
                            we provide a seamless experience to keep your team aligned.
                        </p>
                    </div>
                </AnimatedContent>
                <Skiper16 />
            </section>

            {/* Steps Section */}
            <StepsSection />

            {/* Footer */}
            <Footer />
        </div>
    );
}
