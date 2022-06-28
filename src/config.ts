export default {
  usesIp: false,
  fallbackUser: 'unknown',
  messages: {
    MAX_MESSAGE_SIZE: 2048,
    VIEW_MESSAGE_SIZE: 200,
    rules: [
      {
        limit: 10,
        seconds: 5,
      },
      {
        limit: 20,
        seconds: 60,
      },
    ],
    xssFilter: {
      whiteList: {
        b: [],
        i: [],
        u: [],
        code: [],
      },
    },
  },
  roomRules: {
    maxRooms: 5,
    maxAge: 600,
    maxUsers: 4,
  },
  server: {
    cors: {
      methods: ['GET', 'POST'],
      origin: [
        'http://localhost:3000',
        'http://192.168.15.101:3000',
      ],
    },
  },
};
