import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import createMessageServer from './messageController';

dotenv.config();

const app: Express = express();
const port = process.env.PORT;
app.use(cors());

const server = http.createServer(app);
createMessageServer(server);

app.get('/', (req: Request, res: Response) => {
  res.send('volta chuchu... tá no lugar errado.');
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] running on port: ${port}`);
});
