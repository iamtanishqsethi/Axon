import type {Server} from "socket.io";
import {prisma} from "../lib/prisma.js";
import * as meetingService from "../services/meeting.service.js";
export default function registerMeetingSocket(io:Server) {
    //authentication middleware
    io.of('/').use((socket,next)=>{
        const userId=socket.handshake.auth.userId
        if(!userId){
            return next(new Error("Unauthorized"))
        }
        socket.data.userId=userId
        next()
    })

    io.on('connection',(socket)=>{
        socket.join(`user:${socket.data.userId}`)

        socket.on('join-meeting',async ({meetingId})=>{
            try{
                socket.join(meetingId)

                const participant=await prisma.participant.findUnique({
                    where:{
                        meetingId_userId:{
                            meetingId,
                            userId:socket.data.userId
                        },
                    },
                    include:{
                        user:true,
                    }
                })

                if(!participant){
                    throw new Error("Participant not found")
                }

                //check for waiting user
                if(participant.status==="WAITING"){
                    socket.to(meetingId).emit('new-waiting-user', {
                        userName: participant.user.firstName,
                        userId:socket.data.userId,
                        imageUrl:participant.user.imageUrl,
                        participantId: participant.id
                    });
                }
            }
            catch (e){
                socket.emit('meeting:error',{message:"Error joining room"})
                console.error(e)
            }
        })

        socket.on('approve-user',async ({participantId,meetingId})=>{
            try{
                const userId=socket.data.userId
                const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
                if (!meeting || meeting.hostId !== userId) {
                    socket.emit('meeting:error', { message: 'Unauthorized' });
                    return;
                }

                await meetingService.approveParticipant(meetingId, participantId);

                const participant = await prisma.participant.findUnique({
                    where: {id: participantId}
                });

                if (participant) {
                    io.to(`user:${participant.userId}`).emit('participant-approved', {
                        participantId,
                        meetingId
                    });
                }
            }
            catch (e){
                socket.emit('meeting:error',{message:"Error approving user"})
                console.error(e)

            }

        })

        socket.on('reject-user',async ({participantId,meetingId})=>{
            try{
                const userId=socket.data.userId
                const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
                if (!meeting || meeting.hostId !== userId) {
                    socket.emit('meeting:error', { message: 'Unauthorized' });
                    return;
                }

                await meetingService.rejectParticipant(meetingId, participantId);

                const participant = await prisma.participant.findUnique({
                    where: {id: participantId}
                });

                if (participant) {
                    io.to(`user:${participant.userId}`).emit('participant-rejected', {
                        participantId,
                        meetingId
                    });
                }
            }
            catch (e){
                socket.emit('meeting:error',{message:"Error rejecting user"})
                console.error(e)
            }
        })

        socket.on('leave-meeting',({meetingId, meetingEnded, roomEmpty})=>{
            try{
                const userId=socket.data.userId
                socket.leave(meetingId)
                if (meetingEnded) {
                    socket.to(meetingId).emit('meeting-ended', {meetingId})
                    return
                }

                // If the room is now empty, start the grace-period timer
                if (roomEmpty) {
                    meetingService.startEmptyRoomTimer(meetingId, (endedMeetingId) => {
                        io.to(endedMeetingId).emit('meeting-ended', {meetingId: endedMeetingId})
                    })
                }

                socket.to(meetingId).emit('user-left',{userId})
            }
            catch (e){
                socket.emit('meeting:error',{message:"Error leaving meeting"})
                console.error(e)
            }


        })

        socket.on('chat-message', (data) => {
            if (data.meetingId) {
                socket.to(data.meetingId).emit('chat-message', data);
            }
        })

        socket.on('reaction', (data) => {
            if (data.meetingId) {
                socket.to(data.meetingId).emit('reaction', data);
            }
        })

        socket.on('meeting-ended', async ({meetingId}) => {
            try {
                const userId = socket.data.userId;
                const meeting = await prisma.meeting.findUnique({where: {id: meetingId}});

                if (!meeting || meeting.hostId !== userId) {
                    socket.emit('meeting:error', {message: 'Unauthorized'});
                    return;
                }

                await meetingService.endMeeting(meetingId);
                io.to(meetingId).emit('meeting-ended', {meetingId});
            } catch (e) {
                socket.emit('meeting:error', {message: 'Error ending meeting'});
                console.error(e);
            }
        })
    })
}
