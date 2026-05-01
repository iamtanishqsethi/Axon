"use client";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {Copy, Grid2X2, Layout, Radio} from "lucide-react";
import {toast} from "sonner";
import {getFormatedTime} from "@/utils/getFormatedTime";
import {motion} from "framer-motion";
import GlassSurface from "@/components/GlassSurface";
import { InlineToast } from "../ui/inline-toast";
import { OptionPicker } from "../ui/quick-option-picker";

interface MeetingTopBarProps {
    duration: number;
    roomName: string;
    layoutMode: "grid" | "speaker";
    onLayoutModeChange?: (mode: "grid" | "speaker") => void;
    meetingId: string;
}

function formatRoomName(name: string): string {
    if (!name) return "Room";
    if (/^[0-9a-f]{8}-/i.test(name)) return name.split("-")[0].toUpperCase();
    return name;
}

export function MeetingTopBar({duration, roomName, layoutMode, onLayoutModeChange, meetingId}: MeetingTopBarProps) {
    const displayName = formatRoomName(roomName);

    const copyMeetingId = () => {
        void navigator.clipboard.writeText(meetingId);
        toast.success("Meeting ID copied to clipboard");
    };

    return (
        <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute top-0 left-0 right-0 z-40 flex items-start justify-between p-3 sm:p-4"
        >
            <div className="pointer-events-auto flex flex-wrap items-center gap-2">
                <GlassSurface
                    borderRadius={999}
                    width="auto"
                    height={36}
                    backgroundOpacity={0.05}
                    blur={20}
                    className="overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
                    contentClassName="gap-2 px-3 py-1.5 font-mono text-foreground/90 dark:text-white/90"
                >
                    <Radio className="animate-pulse text-red-400 size-4" />
                    {getFormatedTime(duration)}
                </GlassSurface>
                {/*<Badge*/}
                {/*    variant="secondary"*/}
                {/*    className="max-w-48 border border-white/10 bg-white/5 px-3 py-1.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-2xl text-white/90"*/}
                {/*    title={roomName}*/}
                {/*>*/}
                {/*    <span className="truncate">{displayName}</span>*/}
                {/*</Badge>*/}
                <GlassSurface
                    borderRadius={999}
                    width="auto"
                    height={36}
                    backgroundOpacity={0.05}
                    blur={20}
                    className="hidden md:block shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
                    contentClassName="p-0"
                >
                    <OptionPicker
                        options={[
                            { id: "grid", label: "Grid", icon: Grid2X2 },
                            { id: "speaker", label: "Speaker", icon: Layout },
                        ]}
                        value={layoutMode}
                        onChange={(id) => {
                            if (onLayoutModeChange) {
                                onLayoutModeChange(id as "grid" | "speaker");
                            }
                        }}
                    />
                </GlassSurface>
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
                <GlassSurface
                    borderRadius={999}
                    width="auto"
                    height={36}
                    backgroundOpacity={0.05}
                    blur={20}
                    className="overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
                    contentClassName="p-0"
                >
                    <InlineToast code={meetingId} className="min-w-[140px] h-full" />
                </GlassSurface>
            </div>
        </motion.div>
    );
}
