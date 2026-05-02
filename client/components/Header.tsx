'use client'

import React, { useState } from "react";
import {
    Navbar,
    NavBody,
    MobileNav,
    MobileNavHeader,
    MobileNavToggle,
    MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Zap } from "lucide-react";
import { usePathname } from "next/navigation";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";
import GlassSurface from "./GlassSurface";
import { Button } from "./ui/button";

const navItems = [
    { name: "Create Meeting", link: "/create" },
    { name: "Join Meeting", link: "/join" },
];

export default function Header() {
    const pathName = usePathname()
    const isMeetingPage = pathName.startsWith('/meeting/')
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    if (isMeetingPage) return null;

    return (
        <Navbar className="fixed top-0 left-0 right-0 z-50">
            {/* Desktop Navigation */}
            <NavBody className="p-0 border-none bg-transparent shadow-none backdrop-blur-0 dark:bg-transparent overflow-visible">
                <GlassSurface
                    width="100%"
                    height="100%"
                    borderRadius={999}
                    className="w-full h-full"
                    backgroundOpacity={0.1}
                    blur={12}
                    saturation={1.2}
                >
                    <div className="flex items-center justify-between w-full px-8 py-1.5 relative">
                        <Link href="/" className="interactive-lift flex items-center gap-2.5 relative z-50">
                            <div className="flex size-8 items-center justify-center rounded-xl overflow-hidden shadow-sm shadow-primary/20">
                                <img src="/icon.png" alt="Axon Logo" className="size-full object-cover" />
                            </div>
                            <span className="text-lg font-bold tracking-tight uppercase">Axon</span>
                        </Link>

                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="flex items-center gap-8 pointer-events-auto">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.link}
                                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 relative z-50">
                            <AnimatedThemeToggler />
                            <Show when="signed-out">
                                <SignInButton>
                                    <Button variant="ghost" size="sm" className="cursor-pointer text-sm font-medium rounded-full py-1.5">
                                        Sign In
                                    </Button>
                                </SignInButton>
                                <SignUpButton>
                                    <Button size="sm" className="cursor-pointer text-sm font-medium shadow-sm shadow-primary/20 rounded-full py-1.5">
                                        Sign Up
                                    </Button>
                                </SignUpButton>
                            </Show>
                            <Show when="signed-in">
                                <UserButton />
                            </Show>
                        </div>
                    </div>
                </GlassSurface>
            </NavBody>

            {/* Mobile Navigation */}
            <MobileNav className="p-0 border-none bg-transparent shadow-none backdrop-blur-0 lg:hidden overflow-visible">
                <GlassSurface
                    width="100%"
                    height="100%"
                    borderRadius={32}
                    className="w-full h-full"
                    backgroundOpacity={0.1}
                    blur={12}
                    saturation={1.2}
                >
                    <div className="flex flex-col w-full relative">
                        <MobileNavHeader>
                            <Link href="/" className="interactive-lift flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg overflow-hidden shadow-sm shadow-primary/20">
                                    <img src="/icon.png" alt="Axon Logo" className="size-full object-cover" />
                                </div>
                                <span className="text-base font-bold tracking-tight uppercase">Axon</span>
                            </Link>
                            <div className="flex items-center gap-1.5">
                                <AnimatedThemeToggler />
                                <Show when="signed-in">
                                    <UserButton />
                                </Show>
                                <MobileNavToggle
                                    isOpen={isMobileMenuOpen}
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                />
                            </div>
                        </MobileNavHeader>

                        <MobileNavMenu
                            isOpen={isMobileMenuOpen}
                            onClose={() => setIsMobileMenuOpen(false)}
                            className="top-16 left-0 right-0 mx-0 w-auto border border-border/50 p-0"
                        >
                            <div className="px-5 py-5 space-y-1">
                                {navItems.map((item, idx) => (
                                    <Link
                                        key={`mobile-link-${idx}`}
                                        href={item.link}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                                <div className="flex w-full flex-col gap-2 pt-3 mt-2 border-t border-border/50">
                                    <Show when="signed-out">
                                        <SignInButton>
                                            <Button variant="outline" size="sm" className="w-full h-9 text-sm rounded-full">Sign In</Button>
                                        </SignInButton>
                                        <SignUpButton>
                                            <Button size="sm" className="w-full h-9 text-sm rounded-full">Sign Up</Button>
                                        </SignUpButton>                                    </Show>
                                </div>
                            </div>
                        </MobileNavMenu>
                    </div>
                </GlassSurface>
            </MobileNav>
        </Navbar>
    );
}
