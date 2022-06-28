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

    if (!rooms.registerRoom(data.roomId, data.userId, userIp, socket)) {
      return;
    }

    rooms.sendToRoom(data.roomId, socket, SocketAction.USER_JOINED, {
      id: uuidv4(),
      nickname: data.nickname || data.userId.split('-')[0],
    });

    rooms.sendToRoom(socket.id, io, SocketAction.ROOM_CONFIG, {
      messages: config.messages,
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

    rooms.sendToRoom(data.roomId, io, SocketAction.RECEIVE_MESSAGE, {
      id: uuidv4(),
      ...messageData,
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
