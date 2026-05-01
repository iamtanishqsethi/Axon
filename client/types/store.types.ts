export interface ChatMessage {
    id?:string;
    text:string;
    userId:string;
    userName?:string;
    timestamp?:number;
}

export interface User{
    id:string;
    email:string;
    firstName:string;
    lastName?:string;
    imageUrl?:string;
}

export interface WaitingRoomUser{
   id:string;
   userId:string;
   user:User;
   status:string;
}

export interface MediaPreferences {
    username: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
    audioDeviceId: string;
    videoDeviceId: string;
}

export interface MeetingStore {
    //live kit
    token:string|null
    setToken:(token:string)=>void
    clearToken:()=>void

    //meeting info
    meetingId:string|null
    setMeetingId:(meetingId:string)=>void
    clearMeetingId:()=>void
    isHost:boolean
    setHost:(v:boolean)=>void

    //prejoin
    mediaPreferences: MediaPreferences
    setMediaPreferences:(preferences: Partial<MediaPreferences>)=>void
    resetMediaPreferences:()=>void

    //chat
    chatMessages:ChatMessage[]
    setChatMessages:(message:ChatMessage)=>void
    clearMessage:()=>void


    //sidebar
    isChatOpen:boolean
    isParticipantsOpen:boolean
    toggleChat:()=>void
    toggleParticipants:()=>void

    // sidebar v2 (ui-meet)
    activePanel: "chat" | "participants" | "editor" | "whiteboard" | null
    setActivePanel: (panel: "chat" | "participants" | "editor" | "whiteboard" | null) => void
    togglePanel: (panel: "chat" | "participants" | "editor" | "whiteboard") => void

    // waiting room
    waitingRoomCount: number
    setWaitingRoomCount: (count: number) => void
}
