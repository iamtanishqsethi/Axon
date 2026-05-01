import {create} from 'zustand'
import { MeetingStore} from "@/types/store.types";

const defaultMediaPreferences = {
    username: "Axon",
    audioEnabled: true,
    videoEnabled: true,
    audioDeviceId: "",
    videoDeviceId: "",
};

export const useMeetingStore = create<MeetingStore>((set)=>({
    //live kit
    token:null,
    setToken:(token)=>set({token}),
    clearToken:()=>set({token:null}),

    //meeting info
    meetingId:null,
    setMeetingId:(id)=>set({meetingId:id}),
    clearMeetingId:()=>set({meetingId:null}),
    isHost:false,
    setHost:(v)=>set({isHost:v}),

    //prejoin
    mediaPreferences: defaultMediaPreferences,
    setMediaPreferences:(preferences)=>set((state)=>({
        mediaPreferences:{
            ...state.mediaPreferences,
            ...preferences,
        }
    })),
    resetMediaPreferences:()=>set({mediaPreferences: defaultMediaPreferences}),

    //chat
    chatMessages:[],
    setChatMessages:(message)=>set((state)=>({chatMessages:[...state.chatMessages,message]})),
    clearMessage:()=>set({chatMessages:[]}),

    //sidebar visibility
    isChatOpen:false,
    isParticipantsOpen:false,
    toggleChat:()=>set((state)=>({
        isChatOpen:!state.isChatOpen,
        isParticipantsOpen:!state.isChatOpen ? false : state.isParticipantsOpen
    })),
    toggleParticipants:()=>set((state)=>({
        isParticipantsOpen:!state.isParticipantsOpen,
        isChatOpen:!state.isParticipantsOpen ? false : state.isChatOpen
    })),

    // sidebar v2 (ui-meet)
    activePanel: null,
    setActivePanel: (panel) => set({activePanel: panel}),
    togglePanel: (panel) => set((state) => ({
        activePanel: state.activePanel === panel ? null : panel
    })),

    // waiting room
    waitingRoomCount: 0,
    setWaitingRoomCount: (count) => set({waitingRoomCount: count}),
}))
