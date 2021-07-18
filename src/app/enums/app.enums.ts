export enum MessageType {
    Customer_Agent_Message = 1,
    Activity_Message = 2,
    Private_Message = 3,
    Image_Message = 10,
    File_Message = 11,
    Bot_Text_Message = 15,
    Form_Message = 17,
    Button_Message = 16,
    Feedback_Message = 14,
    Video_Call = 18,
    Payment_Message = 19,
    Custom_Action_Message= 20
}

export enum UserType {
    Bot = 0,
    Customer = 2,
    Agent = 1
}

export enum NotificationType {
    Chat_Reassign = 3,
    Read_Unread = 5,
    Read_All = 6,
    User_Migration = 7,
    User_Logout = 8,
    User_Online_Status = 15,
    INRIDE_STATUS = 16,
    CHANNEL_REFRESH_AGENT = 17,
    Channel_Refresh = 13
}

export enum Typing {
    Typing_End = 0,
    Typing_Start = 1,
    Typing_Stopped = 2
}

export enum MessageStatus {
    Sending = 0,
    Sent = 1,
    Delivered = 2,
    Read = 3
}
export enum ChatType {
    p2p = 1,
    other = 0,
    AdminToAdmin = 2
}
export enum IntegrationTypes {
  EMAIL = 5,
  MESSENGER = 6,
  WHATSAPP = 7
}
