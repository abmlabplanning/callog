import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './modules/auth/auth.router';
import logsRouter from './modules/logs/logs.router';
import postsRouter from './modules/posts/posts.router';
import likesRouter from './modules/likes/likes.router';
import commentsRouter from './modules/comments/comments.router';
import usersRouter from './modules/users/users.router';
import chatRouter from './modules/chat/chat.router';
import { errorMiddleware } from './middlewares/error.middleware';

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some((o) => origin.startsWith(o.trim()))) cb(null, true);
    else cb(new Error('CORS 차단'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/debug/env', (_req, res) => {
  const key = process.env.SUPABASE_SERVICE_KEY || '';
  const url = process.env.SUPABASE_URL || '';
  res.json({ keyLen: key.length, keyStart: key.slice(0, 20), keyEnd: key.slice(-10), url });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/logs', logsRouter);
app.use('/api/posts', postsRouter);
app.use('/api/posts/:postId/likes', likesRouter);
app.use('/api/posts/:postId/comments', commentsRouter);
app.use('/api', chatRouter);

app.use(errorMiddleware);

export default app;
