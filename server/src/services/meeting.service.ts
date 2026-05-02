import {prisma} from "../lib/prisma.js";
import {createLiveKitToken} from "./livekit.service.js";
import {nanoid} from "nanoid";

export class MeetingServiceError extends Error {
    statusCode: number;
    code: string;

    constructor(message: string, statusCode = 400, code = "MEETING_ERROR") {
        super(message);
        this.name = "MeetingServiceError";
        this.statusCode = statusCode;
        this.code = code;
    }
}

function meetingNotFound() {
    return new MeetingServiceError("Meeting not found", 404, "MEETING_NOT_FOUND");
}

function meetingEnded() {
    return new MeetingServiceError("Meeting has already ended", 410, "MEETING_ENDED");
}

async function getMeetingOrThrow(meetingId: string) {
    const meeting = await prisma.meeting.findUnique({where: {id: meetingId}});
    if (!meeting) {
        throw meetingNotFound();
    }

    return meeting;
}

// ── Empty-room grace period (2 minutes) ──────────────────────────────
const EMPTY_ROOM_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

// Stores the pending timeout handle for each meeting that is counting down
const emptyRoomTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Cancel and remove a pending empty-room timer for a meeting.
 * Returns true if a timer was actually cancelled.
 */
export function cancelEmptyRoomTimer(meetingId: string): boolean {
    const timer = emptyRoomTimers.get(meetingId);
    if (timer) {
        clearTimeout(timer);
        emptyRoomTimers.delete(meetingId);
        console.log(`[meeting:${meetingId}] Empty-room timer cancelled — participant rejoined`);
        return true;
    }
    return false;
}

/**
 * Starts the 2-minute empty-room countdown. When it fires, the meeting is
 * ended in the DB and socketCallback is invoked so the socket layer can
 * broadcast the event to any remaining listeners.
 */
export function startEmptyRoomTimer(
    meetingId: string,
    socketCallback: (meetingId: string) => void
): void {
    // If there's already a timer running for this meeting, don't start another
    if (emptyRoomTimers.has(meetingId)) return;

    console.log(`[meeting:${meetingId}] All participants left — starting ${EMPTY_ROOM_TIMEOUT_MS / 1000}s empty-room timer`);

    const timer = setTimeout(async () => {
        emptyRoomTimers.delete(meetingId);

        try {
            // Re-check: someone may have rejoined in the meantime
            const approvedCount = await prisma.participant.count({
                where: {meetingId, status: "APPROVED"}
            });

            if (approvedCount > 0) {
                console.log(`[meeting:${meetingId}] Timer fired but participants are present — skipping end`);
                return;
            }

            await prisma.meeting.update({
                where: {id: meetingId},
                data: {status: "ENDED", endedAt: new Date()}
            });

            console.log(`[meeting:${meetingId}] Meeting ended after empty-room timeout`);
            socketCallback(meetingId);
        } catch (e) {
            console.error(`[meeting:${meetingId}] Error ending meeting after timeout`, e);
        }
    }, EMPTY_ROOM_TIMEOUT_MS);

    emptyRoomTimers.set(meetingId, timer);
}

export async function createMeeting(userId:string,title:string){
    return prisma.meeting.create({
        data:{
            id:nanoid(8),
            title,
            hostId:userId,
            participants:{
                create:{
                    userId,
                    role:"HOST",
                    status:"APPROVED"
                }
            }
        }
    })
}

export async function joinMeeting(meetingId:string,userId:string){
    const meeting = await getMeetingOrThrow(meetingId);
    if (meeting.status === 'ENDED') {
        throw meetingEnded();
    }

    // If someone is joining/rejoining, cancel any pending empty-room timer
    cancelEmptyRoomTimer(meetingId);

    return prisma.$transaction(async (tx)=>{
        const existingMeet=await tx.participant.findUnique({
            where:{
                meetingId_userId:{
                    meetingId,
                    userId
                }}
        })

        if(existingMeet){
            if (existingMeet.status === "LEFT") {
                const rejoinedParticipant = await tx.participant.update({
                    where: {
                        meetingId_userId: {
                            meetingId,
                            userId
                        }
                    },
                    data: {
                        status: "APPROVED",
                        joinedAt: new Date(),
                        leftAt: null
                    }
                });

                return {
                    status: rejoinedParticipant.status,
                    isHost: meeting.hostId === userId,
                    participantId: rejoinedParticipant.id
                };
            }

            return {
                status:existingMeet.status,
                isHost: meeting.hostId === userId,
                participantId: existingMeet.id
            }
        }

        const participant = await tx.participant.create({
            data:{
                meetingId,
                userId,
                role:"MEMBER",
                status:"WAITING",
            }
        })

        return {
            status:"WAITING",
            isHost: meeting.hostId === userId,
            participantId: participant.id
        }
    })


}

export async function getWaitingUsers(meetingId:string){
    
    return prisma.participant.findMany({
        where:{
            meetingId,
            status:"WAITING"
        },
        include:{
            user:true
        }
    })
}

export async function approveParticipant(meetingId:string,participantId:string){
     await prisma.participant.update({
         where:{id:participantId,meetingId},
         data:{status:"APPROVED"}
     })
}

export async function rejectParticipant(meetingId:string,participantId:string){
    await prisma.participant.update({
        where:{id:participantId,meetingId},
        data:{status:"REJECTED"}
    })
}

export async function leaveMeeting(meetingId:string,userId:string){
    return prisma.$transaction(async (tx) => {
        const meeting = await tx.meeting.findUnique({
            where: {id: meetingId}
        });

        if (!meeting) {
            throw meetingNotFound();
        }

        if (meeting.status === "ENDED") {
            return {meetingEnded: true};
        }

        const participant = await tx.participant.findUnique({
            where: {
                meetingId_userId: {
                    meetingId,
                    userId
                }
            }
        });

        if (!participant) return {meetingEnded: false};

        if (participant.status === "WAITING") {
            await tx.participant.delete({
                where: { id: participant.id }
            });
            return {meetingEnded: false};
        }

        const isApproved = participant.status === "APPROVED";

        await tx.participant.update({
            where:{
                id: participant.id
            },
            data:{
                status: isApproved ? "LEFT" : participant.status,
                leftAt: new Date()
            }
        });

        const approvedParticipantsCount = await tx.participant.count({
            where: {
                meetingId,
                status: "APPROVED"
            }
        });

        if (approvedParticipantsCount === 0) {
            // Don't end immediately — return flag so the controller/socket
            // layer can start the empty-room grace-period timer instead.
            return {meetingEnded: false, roomEmpty: true};
        }

        return {meetingEnded: false};
    });
}

export async function endMeeting(meetingId: string) {
    // Cancel any pending empty-room timer since we're ending explicitly
    cancelEmptyRoomTimer(meetingId);

    const meeting = await getMeetingOrThrow(meetingId);

    if (meeting.status === "ENDED") {
        return meeting;
    }

    const endedAt = new Date();

    return prisma.$transaction(async (tx) => {
        await tx.participant.updateMany({
            where: {
                meetingId,
                status: {
                    not: "LEFT"
                }
            },
            data: {
                status: "LEFT",
                leftAt: endedAt
            }
        });

        return tx.meeting.update({
            where: {id: meetingId},
            data: {
                status: "ENDED",
                endedAt
            }
        });
    });
}

export async function getParticipants(meetingId:string){
    return prisma.participant.findMany({
        where: {
            meetingId,
            status: "APPROVED"
        },
        include: {
            user: true
        }
    });
}

export async function generateToken(meetingId:string,userId:string){
    const meeting = await getMeetingOrThrow(meetingId);
    if (meeting.status === "ENDED") {
        throw meetingEnded();
    }

    const participant=await prisma.participant.findUnique({
        where:{
            meetingId_userId:{
                meetingId,
                userId
            }
        }
    })

    if(!participant||participant.status!=="APPROVED"){
        throw new MeetingServiceError("Not authorized to generate token", 403, "TOKEN_FORBIDDEN")
    }

    return createLiveKitToken(meetingId,userId)
}
