'use client'

import {useMeetingStore} from "@/store/meetingStore";
import {useRouter} from "next/navigation";
import {endMeeting, leaveMeeting} from "@/services/api";
import {socket} from "@/lib/socket";
import {LiveKitRoom} from "@livekit/components-react";
import {toast} from "sonner";
import {useEffect, useRef, useState} from "react";
import {RoomContent} from "@/components/RoomContent";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {playMeetingSound, warmMeetingSounds} from "@/lib/meeting-sounds";
import MeetingEndedScreen from "@/components/MeetingEndedScreen";
import MeetingErrorScreen from "@/components/MeetingErrorScreen";
import MeetingLeftScreen from "@/components/MeetingLeftScreen";

interface MeetingLayoutProps {
    meetingId: string;
}


export default function MeetingLayout({meetingId}: MeetingLayoutProps ){

    const token=useMeetingStore(store=>store.token)
    const clearToken=useMeetingStore(store=>store.clearToken)
    const isHost=useMeetingStore(store=>store.isHost)
    const setHost = useMeetingStore(store => store.setHost)
    const mediaPreferences=useMeetingStore(store=>store.mediaPreferences)

    const router=useRouter()
    const isLeavingRef = useRef(false)
    const meetingEndedRef = useRef(false)
    const [meetingEnded, setMeetingEnded] = useState(false)
    const [meetingLeft, setMeetingLeft] = useState(false)

    const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    useEffect(() => {
        void warmMeetingSounds();
    }, []);

    useEffect(() => {
        const handleNewWaitingUser = (data: unknown) => {
            const payload = data as { userName: string; imageUrl?: string };
            if (isHost) {
                playMeetingSound("waiting");
                toast.custom((t) => (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-border/50 bg-muted/50 dark:bg-white/5">
                            <AvatarImage src={payload.imageUrl} alt={payload.userName} />
                            <AvatarFallback className="bg-transparent font-medium">
                                {payload.userName?.charAt(0).toUpperCase() || '?'}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium tracking-wide">
                            <span className="font-bold text-foreground dark:text-white">{payload.userName}</span> is waiting to join
                        </span>
                    </div>
                ));
            }
            console.log("new user waiting", data);
        };

        const handleUserLeaveEvent=(data: unknown)=>{
            console.log("user left",data)
        }

        const handleMeetingEnded = () => {
            meetingEndedRef.current = true
            clearToken()
            setHost(false)
            setMeetingEnded(true)
            playMeetingSound("ended")
            toast.message("This meeting has ended")
        }

        socket.on('new-waiting-user', handleNewWaitingUser);
        socket.on('user-left',handleUserLeaveEvent)
        socket.on('meeting-ended', handleMeetingEnded)

        return () => {
            socket.off('new-waiting-user', handleNewWaitingUser);
            socket.off('user-left',handleUserLeaveEvent)
            socket.off('meeting-ended', handleMeetingEnded)
        };
    }, [clearToken, isHost, setHost, token]);

    const handleLeave=async ()=>{
        if (meetingEndedRef.current) {
            return
        }

        if (isLeavingRef.current) {
            return
        }

        isLeavingRef.current = true

        try{
            const response = await leaveMeeting(meetingId)
            socket.emit('leave-meeting', {
                meetingId,
                meetingEnded: Boolean(response?.meetingEnded),
                roomEmpty: Boolean(response?.roomEmpty)
            })
            clearToken()
            setHost(false)
            setMeetingLeft(true)
        }
        catch (e){
            console.error("Error Leaving meeting",e)
            isLeavingRef.current = false
        }
    }

    const handleEndMeeting = async () => {
        if (isLeavingRef.current) {
            return
        }

        isLeavingRef.current = true

        try {
            await endMeeting(meetingId)
            socket.emit('meeting-ended', {meetingId})
            meetingEndedRef.current = true
            clearToken()
            setHost(false)
            setMeetingEnded(true)
        } catch (e) {
            console.error("Error ending meeting", e)
            isLeavingRef.current = false
        }
    }

    if (meetingEnded) {
        return <MeetingEndedScreen message="This meeting has already ended." />;
    }

    if (meetingLeft) {
        return <MeetingLeftScreen />;
    }

    if (!token || !LIVEKIT_URL) {
        return <MeetingErrorScreen type="error" title="Connection Failed" message="Missing connection details. Please rejoin the meeting." />;
    }

    const videoInput = mediaPreferences.videoEnabled
        ? (mediaPreferences.videoDeviceId ? {deviceId: mediaPreferences.videoDeviceId} : true)
        : false

    const audioInput = mediaPreferences.audioEnabled
        ? (mediaPreferences.audioDeviceId ? {deviceId: mediaPreferences.audioDeviceId} : true)
        : false


    return(

        <div className={'flex flex-col w-full h-screen overflow-hidden'}>
            <LiveKitRoom
                serverUrl={LIVEKIT_URL}
                token={token}
                video={videoInput}
                audio={audioInput}
                onConnected={() => playMeetingSound("joined")}
                onDisconnected={handleLeave}
                className="flex flex-col h-full w-full"
                data-lk-theme="default"
            >
                <RoomContent handleLeave={handleLeave} handleEndMeeting={handleEndMeeting} meetingId={meetingId}/>

            </LiveKitRoom>
        </div>


    )

}
