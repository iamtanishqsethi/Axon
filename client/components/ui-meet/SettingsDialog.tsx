"use client";

import {MediaDeviceSelect} from "@livekit/components-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Slider} from "@/components/ui/slider";
import {Switch} from "@/components/ui/switch";
import {Button} from "@/components/ui/button";
import {LayoutGrid, Mic, Monitor, Settings, User, Video, Volume2} from "lucide-react";
import {useState} from "react";
import {motion, AnimatePresence} from "framer-motion";

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    layoutMode: "grid" | "speaker";
    onLayoutModeChange: (mode: "grid" | "speaker") => void;
}

export default function SettingsDialog({
    open,
    onOpenChange,
    layoutMode,
    onLayoutModeChange,
}: SettingsDialogProps) {
    const [noiseSuppression, setNoiseSuppression] = useState(true);
    const [outputVolume, setOutputVolume] = useState([72]);
    const [activeTab, setActiveTab] = useState("audio");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[480px] max-h-[85vh] overflow-y-auto overflow-x-hidden border border-border/50 bg-background/80 p-7 shadow-2xl backdrop-blur-3xl sm:rounded-[32px] dark:bg-zinc-950/70 dark:border-white/[0.08] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-border/80">
                <DialogHeader className="mb-4">
                    <DialogTitle className="flex flex-row items-center gap-3 text-2xl font-semibold tracking-tight text-foreground">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-muted border border-border shadow-inner dark:bg-white/[0.05] dark:border-white/5">
                            <Settings className="size-5 text-foreground/90 dark:text-white/90" />
                        </div>
                        Settings
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col text-foreground w-full">
                    <TabsList className="relative flex h-14 w-full rounded-[20px] border border-border bg-muted/30 p-1.5 shadow-inner dark:border-white/[0.05] dark:bg-white/[0.03]">
                        <TabsTrigger
                            value="audio"
                            className="relative flex-1 rounded-2xl text-muted-foreground/60 transition-all data-[state=active]:text-foreground sm:h-full bg-transparent overflow-hidden dark:text-white/50 dark:data-[state=active]:text-white"
                            tabIndex={-1}
                        >
                            {activeTab === "audio" && (
                                <motion.div
                                    layoutId="active-settings-tab"
                                    className="absolute inset-0 z-0 rounded-2xl bg-background/80 shadow-md dark:bg-white/[0.08] dark:shadow-[0_0_20px_rgba(255,255,255,0.03)]"
                                    transition={{type: "spring", stiffness: 300, damping: 28}}
                                />
                            )}
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                <Mic className="size-4" />
                                <span className="text-sm font-medium">Audio</span>
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="video"
                            className="relative flex-1 rounded-2xl text-muted-foreground/60 transition-all data-[state=active]:text-foreground sm:h-full bg-transparent overflow-hidden dark:text-white/50 dark:data-[state=active]:text-white"
                            tabIndex={-1}
                        >
                            {activeTab === "video" && (
                                <motion.div
                                    layoutId="active-settings-tab"
                                    className="absolute inset-0 z-0 rounded-2xl bg-background/80 shadow-md dark:bg-white/[0.08] dark:shadow-[0_0_20px_rgba(255,255,255,0.03)]"
                                    transition={{type: "spring", stiffness: 300, damping: 28}}
                                />
                            )}
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                <Video className="size-4" />
                                <span className="text-sm font-medium">Video</span>
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="general"
                            className="relative flex-1 rounded-2xl text-muted-foreground/60 transition-all data-[state=active]:text-foreground sm:h-full bg-transparent overflow-hidden dark:text-white/50 dark:data-[state=active]:text-white"
                            tabIndex={-1}
                        >
                            {activeTab === "general" && (
                                <motion.div
                                    layoutId="active-settings-tab"
                                    className="absolute inset-0 z-0 rounded-2xl bg-background/80 shadow-md dark:bg-white/[0.08] dark:shadow-[0_0_20px_rgba(255,255,255,0.03)]"
                                    transition={{type: "spring", stiffness: 300, damping: 28}}
                                />
                            )}
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                <Monitor className="size-4" />
                                <span className="text-sm font-medium">General</span>
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    <motion.div 
                        layout 
                        className="relative mt-8"
                        transition={{type: "spring", stiffness: 300, damping: 30}}
                    >
                        <AnimatePresence mode="popLayout" initial={false}>
                            <motion.div
                                key={activeTab}
                                initial={{opacity: 0, y: 15, filter: "blur(4px)"}}
                                animate={{opacity: 1, y: 0, filter: "blur(0px)"}}
                                exit={{opacity: 0, y: -15, filter: "blur(4px)"}}
                                transition={{duration: 0.3, ease: "easeOut"}}
                                className="w-full flex flex-col gap-6"
                            >
                                {activeTab === "audio" && (
                                    <>
                                        <div className="flex flex-col gap-3">
                                            <span className="pl-1 text-sm font-medium text-muted-foreground/60 dark:text-white/60">Microphone</span>
                                            <div className="rounded-[20px] border border-border bg-muted/20 p-2 [&_.lk-active>button]:bg-primary/10 [&_.lk-active>button]:font-medium [&_.lk-active>button]:text-primary [&_[data-lk-active=true]>button]:bg-primary/10 [&_[data-lk-active=true]>button]:font-medium [&_[data-lk-active=true]>button]:text-primary [&_button:hover]:bg-muted/80 [&_button:hover]:text-foreground [&_button]:w-full [&_button]:rounded-2xl [&_button]:px-4 [&_button]:py-3.5 [&_button]:text-left [&_button]:text-sm [&_button]:text-muted-foreground/60 [&_button]:transition-all [&_li]:list-none [&>ul]:flex [&>ul]:flex-col [&>ul]:gap-1 dark:border-white/[0.06] dark:bg-white/[0.02] dark:[&_button:hover]:bg-white/[0.06] dark:[&_button:hover]:text-white/90 dark:[&_button]:text-zinc-400 dark:[&_.lk-active>button]:bg-white/10 dark:[&_.lk-active>button]:text-white dark:[&_[data-lk-active=true]>button]:bg-white/10 dark:[&_[data-lk-active=true]>button]:text-white">
                                                <MediaDeviceSelect kind="audioinput" />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-5 rounded-[24px] border border-border bg-muted/20 p-6 shadow-inner dark:border-white/[0.06] dark:bg-white/[0.02]">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="flex items-center gap-3 text-sm font-medium text-foreground/80 dark:text-white/80">
                                                    <div className="flex size-9 items-center justify-center rounded-full bg-muted shadow-inner border border-border dark:bg-white/[0.08] dark:border-white/5">
                                                        <Volume2 className="size-4 text-foreground/90 dark:text-white/90" />
                                                    </div>
                                                    Output volume
                                                </span>
                                                <span className="tabular-nums text-sm font-medium text-muted-foreground/70 dark:text-white/50">{outputVolume[0]}%</span>
                                            </div>
                                            <Slider
                                                value={outputVolume}
                                                onValueChange={setOutputVolume}
                                                max={100}
                                                step={1}
                                                aria-label="Output volume"
                                                className="mt-1 [&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-thumb]]:border border-black/10 [&_[data-slot=slider-thumb]]:bg-background [&_[data-slot=slider-thumb]]:shadow-md [&_[data-slot=slider-thumb]]:focus-visible:ring-primary/20 [&_[data-slot=slider-track]]:bg-muted [&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-thumb]]:size-5 dark:[&_[data-slot=slider-range]]:bg-white/90 dark:[&_[data-slot=slider-thumb]]:bg-white dark:[&_[data-slot=slider-track]]:bg-white/10 dark:[&_[data-slot=slider-thumb]]:border-white/10"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between rounded-[24px] border border-border bg-muted/20 p-6 shadow-inner dark:border-white/[0.06] dark:bg-white/[0.02]">
                                            <span className="text-sm font-medium text-foreground/80 dark:text-white/80">Noise suppression</span>
                                            <Switch
                                                checked={noiseSuppression}
                                                onCheckedChange={setNoiseSuppression}
                                                aria-label="Toggle noise suppression"
                                                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted border-border shadow-inner dark:data-[state=checked]:bg-white dark:data-[state=unchecked]:bg-white/10 dark:border-white/10 [&_[data-slot=switch-thumb]]:bg-background dark:[&_[data-slot=switch-thumb]]:bg-zinc-950"
                                            />
                                        </div>
                                    </>
                                )}

                                {activeTab === "video" && (
                                    <>
                                        <div className="flex flex-col gap-3">
                                            <span className="pl-1 text-sm font-medium text-muted-foreground/60 dark:text-white/60">Camera</span>
                                            <div className="rounded-[20px] border border-border bg-muted/20 p-2 [&_.lk-active>button]:bg-primary/10 [&_.lk-active>button]:font-medium [&_.lk-active>button]:text-primary [&_[data-lk-active=true]>button]:bg-primary/10 [&_[data-lk-active=true]>button]:font-medium [&_[data-lk-active=true]>button]:text-primary [&_button:hover]:bg-muted/80 [&_button:hover]:text-foreground [&_button]:w-full [&_button]:rounded-2xl [&_button]:px-4 [&_button]:py-3.5 [&_button]:text-left [&_button]:text-sm [&_button]:text-muted-foreground/60 [&_button]:transition-all [&_li]:list-none [&>ul]:flex [&>ul]:flex-col [&>ul]:gap-1 dark:border-white/[0.06] dark:bg-white/[0.02] dark:[&_button:hover]:bg-white/[0.06] dark:[&_button:hover]:text-white/90 dark:[&_button]:text-zinc-400 dark:[&_.lk-active>button]:bg-white/10 dark:[&_.lk-active>button]:text-white dark:[&_[data-lk-active=true]>button]:bg-white/10 dark:[&_[data-lk-active=true]>button]:text-white">
                                                <MediaDeviceSelect kind="videoinput" />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {activeTab === "general" && (
                                    <>
                                        <div className="flex items-center justify-between gap-3 rounded-[24px] border border-border bg-muted/20 p-6 shadow-inner dark:border-white/[0.06] dark:bg-white/[0.02]">
                                            <div>
                                                <p className="text-sm font-medium text-foreground/90 dark:text-white/90">Layout mode</p>
                                                <p className="mt-1.5 text-xs text-muted-foreground/60 leading-relaxed dark:text-white/50">Choose how participants<br/>are displayed in the meeting</p>
                                            </div>
                                            <div className="flex rounded-full bg-muted p-1.5 border border-border shadow-inner dark:bg-white/[0.04] dark:border-white/[0.02]">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onLayoutModeChange("grid")}
                                                    className={`flex h-9 items-center rounded-full px-5 text-xs font-medium transition-all ${layoutMode === "grid" ? "bg-background text-foreground shadow-md dark:bg-white/[0.12] dark:text-white" : "text-muted-foreground/60 hover:text-foreground dark:text-white/40 dark:hover:text-white/80"}`}
                                                >
                                                    <LayoutGrid className="mr-1 size-3.5" />
                                                    Grid
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onLayoutModeChange("speaker")}
                                                    className={`flex h-9 items-center rounded-full px-5 text-xs font-medium transition-all ${layoutMode === "speaker" ? "bg-background text-foreground shadow-md dark:bg-white/[0.12] dark:text-white" : "text-muted-foreground/60 hover:text-foreground dark:text-white/40 dark:hover:text-white/80"}`}
                                                >
                                                    <User className="mr-1 size-3.5" />
                                                    Speaker
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
