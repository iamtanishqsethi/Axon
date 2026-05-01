"use client";

import {AnimatePresence, motion} from "framer-motion";
import {MessageCircle, Users, X} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Sheet, SheetContent, SheetDescription, SheetTitle} from "@/components/ui/sheet";
import {useEffect, useState} from "react";
import ChatTab from "@/components/ui-meet/ChatTab";
import ParticipantsTab from "@/components/ui-meet/ParticipantsTab";
import GlassSurface from "@/components/GlassSurface";
import {useMeetingStore} from "@/store/meetingStore";

interface TabbedSidebarProps {
    meetingId: string;
    activePanel: "chat" | "participants" | "editor" | "whiteboard" | null;
    onClose: () => void;
    onTabChange: (tab: "chat" | "participants" | "editor" | "whiteboard") => void;
    unreadCount: number;
}

export default function TabbedSidebar({
    meetingId,
    activePanel,
    onClose,
    onTabChange,
    unreadCount,
}: TabbedSidebarProps) {
    const isHost = useMeetingStore(state => state.isHost);
    const waitingRoomCount = useMeetingStore(state => state.waitingRoomCount);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 767px)");
        const update = () => setIsMobile(mediaQuery.matches);
        update();
        mediaQuery.addEventListener("change", update);
        return () => mediaQuery.removeEventListener("change", update);
    }, []);

    const isOpen = activePanel !== null && activePanel !== "editor" && activePanel !== "whiteboard";
    const currentTab = (activePanel === "editor" || activePanel === "whiteboard") ? "chat" : (activePanel ?? "chat");

    const sidebarContent = (
        <Tabs
            value={currentTab}
            onValueChange={(v) => onTabChange(v as "chat" | "participants")}
            className="flex h-full flex-col"
        >
            <div className="flex items-center justify-between border-b border-border/50 px-3 py-2">
                <GlassSurface
                    borderRadius={999}
                    width="100%"
                    height={36}
                    backgroundOpacity={0.05}
                    blur={20}
                    className="mr-1.5"
                    contentClassName="p-0"
                >
                    <TabsList className="h-full w-full bg-transparent border-none p-1 rounded-full relative">
                        <TabsTrigger 
                            value="chat" 
                            className="flex-1 gap-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-none border-none relative z-10 transition-colors duration-300 dark:text-white/60 dark:data-[state=active]:text-white"
                        >
                            {currentTab === "chat" && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-primary/10 rounded-full -z-10 dark:bg-white/10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <MessageCircle size={14} />
                            Chat
                            {unreadCount > 0 && (
                                <Badge className="ml-1 min-w-5 px-1 text-[10px] bg-primary text-white border-none">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger 
                            value="participants" 
                            className="flex-1 gap-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-none border-none relative z-10 transition-colors duration-300 dark:text-white/60 dark:data-[state=active]:text-white"
                        >
                            {currentTab === "participants" && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-primary/10 rounded-full -z-10 dark:bg-white/10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <Users size={14} />
                            People
                            {isHost && waitingRoomCount > 0 && (
                                <Badge className="ml-1 min-w-5 px-1 text-[10px] bg-red-500 text-white border-none">
                                    {waitingRoomCount > 9 ? "9+" : waitingRoomCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </GlassSurface>

                <Button
                    type="button"
                    variant="default"
                    aria-label="Close panel"
                    onClick={onClose}
                    size={'icon-sm'}
                    className=" size-4 shrink-0 text-muted-foreground hover:text-foreground rounded-full dark:text-white/70"
                >
                    <X className="size-4" />
                </Button>
            </div>

            <TabsContent value="chat" className="mt-0 min-h-0 flex-1">
                <ChatTab meetingId={meetingId} />
            </TabsContent>
            <TabsContent value="participants" className="mt-0 min-h-0 flex-1">
                <ParticipantsTab meetingId={meetingId} />
            </TabsContent>
        </Tabs>
    );

    if (isMobile) {
        return (
            <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <SheetContent side="right" showCloseButton={false} className="w-full sm:w-[400px] p-0 sm:max-w-none bg-background/80 backdrop-blur-2xl border-border shadow-[-8px_0_32px_rgba(0,0,0,0.1)] overflow-hidden dark:bg-white/5 dark:border-white/10 dark:shadow-[-8px_0_32px_rgba(0,0,0,0.37)]">
                    <SheetTitle className="sr-only">Meeting Panel</SheetTitle>
                    <SheetDescription className="sr-only">Chat and participants panel</SheetDescription>
                    {sidebarContent}
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.aside
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 400, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{
                        width: { type: "spring", damping: 30, stiffness: 300, restDelta: 0.5 },
                        opacity: { duration: 0.2, ease: "easeInOut" }
                    }}
                    className="hidden md:flex shrink-0 flex-col border-l border-border/50 bg-background/50 backdrop-blur-2xl relative z-40 overflow-hidden dark:border-white/10 dark:bg-white/5"
                >
                    <div className="h-full w-[400px] flex flex-col shadow-[-8px_0_32px_rgba(0,0,0,0.1)] dark:shadow-[-8px_0_32px_rgba(0,0,0,0.37)]">
                        {sidebarContent}
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );

}
