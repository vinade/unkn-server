import dotenv from 'dotenv';
import http from 'http';
import xss from 'xss';
import { v4 as uuidv4 } from 'uuid';
import { Server, Socket } from 'socket.io';
import { RegisterRoom, Message, SocketAction } from './types';
import config from './config';
import RoomController from './roomController';

dotenv.config();

const rooms = new RoomController();

function listenRoom(io:Server, socket: Socket) {
  socket.on(SocketAction.REGISTER_ROOM, (data: RegisterRoom) => {
    const userIp = config.usesIp ? socket.handshake.address : (data.userId || config.fallbackUser);

    const registerAllowed = rooms.registerRoom({
      roomId: data.roomId,
      userId: data.userId,
      userIp,
      socket,
    });

    if (!registerAllowed) {
      return;
    }

    rooms.sendToRoom({
      roomId: data.roomId,
      socket,
      action: SocketAction.USER_JOINED,
      obj: {
        id: uuidv4(),
        nickname: data.nickname || data.userId.split('-')[0],
      },
    });

    rooms.sendToRoom({
      roomId: socket.id,
      socket: io,
      action: SocketAction.ROOM_CONFIG,
      obj: {
        messages: config.messages,
      },
    });
  });
}

function listenMessages(io: Server, socket: Socket) {
  socket.on(SocketAction.SEND_MESSAGE, (data: Message) => {
    const userIp = config.usesIp ? socket.handshake.address : (data.userId || config.fallbackUser);

    if (!rooms.canSend(userIp)) {
      return;
    }

    const messageData = { ...data };
    messageData.message = xss(data.message, config.messages.xssFilter);
    messageData.message = messageData.message.slice(0, config.messages.MAX_MESSAGE_SIZE);
    messageData.userId = rooms.getUserId(userIp);

    rooms.sendToRoom({
      roomId: data.roomId,
      socket: io,
      action: SocketAction.RECEIVE_MESSAGE,
      obj: {
        id: uuidv4(),
        ...messageData,
      },
      userIp,
    });
  });
}

// eslint-disable-next-line no-shadow
export default function createMessageServer(server: http.Server) {
  const io = new Server(server, config.server);
  io.on(SocketAction.CONNECTION, (socket) => {
    listenRoom(io, socket);
    listenMessages(io, socket);
  });
}
