import { Server, Socket } from 'socket.io';
import config from './config';
import MessageLimitRule from './messageLimitRule';
import { SocketAction } from './types';

type RoomRgsParameters = {
  roomId: string;
  userId: string;
  userIp: string;
  socket: Socket;
};

type RoomMsgParameters = {
  roomId: string;
  socket: Socket | Server;
  action: SocketAction;
  obj: Object;
  userIp?:string;
};

export default class RoomController {
  rooms:{
    [key:string]: {
      timestamp: number;
      users: string[];
    }
  };

  users:{
    [key:string]: {
      id: string,
      rules: MessageLimitRule[]
    }
  };

  constructor() {
    this.rooms = {};
    this.users = {};
  }

  canRegister(roomId: string, userIp: string): boolean {
    // Rule: config.roomRules.maxAge
    const timestamp = (new Date()).getTime() / 1000;
    const timestampLimit = timestamp - config.roomRules.maxAge;
    Object.keys(this.rooms).forEach((key) => {
      if (this.rooms[key].timestamp <= timestampLimit) {
        delete this.rooms[key];
      }
    });

    // Rule: config.roomRules.maxRooms
    if (Object.keys(this.rooms).length > config.roomRules.maxRooms) {
      return false;
    }

    if (this.rooms[roomId] === undefined) {
      this.rooms[roomId] = {
        timestamp,
        users: [],
      };
    }

    if (this.rooms[roomId].users.includes(userIp)) {
      return false;
    }

    // Rule: config.roomRules.maxUsers
    return (this.rooms[roomId].users.length < config.roomRules.maxUsers);
  }

  registerRoom({
    roomId, userId, userIp, socket,
  }:RoomRgsParameters): boolean {
    if (!this.canRegister(roomId, userIp)) {
      return false;
    }

    this.rooms[roomId].users.push(userIp);
    this.users[userIp] = {
      id: userId,
      rules: config.messages.rules.map((rule) => new MessageLimitRule(rule.limit, rule.seconds)),
    };

    socket.join(roomId);
    return true;
  }

  sendToRoom({
    roomId, socket, action, obj, userIp,
  }:RoomMsgParameters) {
    if (!this.rooms[roomId] || !this.rooms[roomId].users) {
      return;
    }

    if (userIp) {
      if (!this.rooms[roomId].users.includes(userIp)) {
        return;
      }
    }

    socket.to(roomId).emit(action, obj);
    this.updateRoomTimestamp(roomId);
  }

  updateRoomTimestamp(roomId: string) {
    if (this.rooms[roomId]) {
      this.rooms[roomId].timestamp = (new Date()).getTime() / 1000;
    }
  }

  getUserId(userIp: string): string {
    return this.users[userIp]?.id || config.fallbackUser;
  }

  canSend(userIp: string) {
    return this.users[userIp].rules.reduce((prev, rule) => prev && rule.check(), true);
  }
}
