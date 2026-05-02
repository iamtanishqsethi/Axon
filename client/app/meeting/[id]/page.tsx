'use client'

import {useMeeting} from "@/hooks/useMeeting";
import MeetingLobby from "@/components/ui-meet/MeetingLobby";
import MeetingLayout from "@/components/MeetingLayout";
import {use} from "react";
import MeetingEndedScreen from "@/components/MeetingEndedScreen";
import MeetingErrorScreen from "@/components/MeetingErrorScreen";
import {Spinner} from "@/components/kibo-ui/spinner";
import {motion} from "framer-motion";

export default function MeetingPage({params}: { params: Promise<{ id: string }> }) {
    const {id} = use(params)
    const {status, message} = useMeeting(id)

    return (
        <>
            {status === 'loading' && (
                <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        className={'flex flex-col items-center justify-center gap-4'}
                    >
                        <Spinner variant={'bars'} size={40} />
                        <div className="text-center">
                            <h2 className="text-2xl font-bold tracking-wide uppercase">Connecting</h2>
                            <p className="text-muted-foreground mt-2 text-sm">Joining your secure session...</p>
                        </div>
                    </motion.div>
                </div>
            )}
            {status === 'waiting' && <MeetingLobby meetingId={id}/>}
            {status === 'joined' && <MeetingLayout meetingId={id}/>}
            {status === 'rejected' && <MeetingErrorScreen type="rejected" title="Join Request Rejected" message="The host did not approve your request to join the meeting. Try contacting them directly." />}
            {status === 'error' && <MeetingErrorScreen type="error" title="Meeting Error" message={message || "An unexpected error occurred."} />}
            {status === 'ended' && <MeetingEndedScreen message={message || "This meeting has ended."} />}
        </>
    )
}
