'use strict';
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const statements = [
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
       CREATE TYPE "Role" AS ENUM ('OWNER', 'MEMBER');
     END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MediaType') THEN
       CREATE TYPE "MediaType" AS ENUM ('VIDEO', 'IMAGE');
     END IF;
   END $$`,
  `CREATE TABLE IF NOT EXISTS "User" (
     "id" TEXT NOT NULL PRIMARY KEY,
     "email" TEXT NOT NULL UNIQUE,
     "username" TEXT NOT NULL UNIQUE,
     "passwordHash" TEXT NOT NULL,
     "avatarUrl" TEXT,
     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE TABLE IF NOT EXISTS "RefreshToken" (
     "id" TEXT NOT NULL PRIMARY KEY,
     "token" TEXT NOT NULL UNIQUE,
     "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
     "expiresAt" TIMESTAMPTZ NOT NULL,
     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE TABLE IF NOT EXISTS "Log" (
     "id" TEXT NOT NULL PRIMARY KEY,
     "name" TEXT NOT NULL,
     "inviteCode" TEXT NOT NULL UNIQUE,
     "maxMembers" INT NOT NULL DEFAULT 12,
     "createdById" TEXT NOT NULL,
     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE TABLE IF NOT EXISTS "LogMember" (
     "id" TEXT NOT NULL PRIMARY KEY,
     "logId" TEXT NOT NULL REFERENCES "Log"("id") ON DELETE CASCADE,
     "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
     "role" "Role" NOT NULL DEFAULT 'MEMBER',
     "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     UNIQUE ("logId", "userId")
   )`,
  `CREATE TABLE IF NOT EXISTS "Post" (
     "id" TEXT NOT NULL PRIMARY KEY,
     "authorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
     "logId" TEXT REFERENCES "Log"("id") ON DELETE CASCADE,
     "mediaUrl" TEXT NOT NULL,
     "mediaType" "MediaType" NOT NULL,
     "thumbnailUrl" TEXT,
     "caption" TEXT,
     "takenAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
  `CREATE TABLE IF NOT EXISTS "Like" (
     "id" TEXT NOT NULL PRIMARY KEY,
     "postId" TEXT NOT NULL REFERENCES "Post"("id") ON DELETE CASCADE,
     "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     UNIQUE ("postId", "userId")
   )`,
  `CREATE TABLE IF NOT EXISTS "Comment" (
     "id" TEXT NOT NULL PRIMARY KEY,
     "postId" TEXT NOT NULL REFERENCES "Post"("id") ON DELETE CASCADE,
     "authorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
     "content" TEXT NOT NULL,
     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
];

async function run() {
  console.log('▶ DB 스키마 초기화...');
  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (e) {
      const msg = (e && e.message) ? e.message : String(e);
      if (!msg.includes('already exists')) {
        console.error('오류:', msg.slice(0, 200));
        process.exit(1);
      }
    }
  }
  console.log('✔ 스키마 준비 완료');
  await prisma.$disconnect();
}

run().catch(function(e) { console.error(e); process.exit(1); });
