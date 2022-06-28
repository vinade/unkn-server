/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */

type RegisterRoom = {
    nickname?: string;
    userId: string;
    roomId: string;
};

type Message = {
    id?: string;
    userId?: string;
    roomId: string;
    message: string;
};

enum SocketAction {
    CONNECTION = 'connection',
    REGISTER_ROOM = 'register_to_room',
    USER_JOINED = 'user_joined',
    SEND_MESSAGE = 'send_message',
    RECEIVE_MESSAGE = 'receive_message',
    ROOM_CONFIG = 'room_config',
}

export {
  RegisterRoom,
  Message,
  SocketAction,
};
