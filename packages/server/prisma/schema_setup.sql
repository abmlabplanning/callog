-- callog DB 초기화 SQL
-- Supabase 대시보드 → SQL Editor에서 아래 SQL을 전체 복사하여 실행하세요

-- 기존 테이블 정리 (재실행 시 필요)
DROP TABLE IF EXISTS "Comment" CASCADE;
DROP TABLE IF EXISTS "Like" CASCADE;
DROP TABLE IF EXISTS "Post" CASCADE;
DROP TABLE IF EXISTS "LogMember" CASCADE;
DROP TABLE IF EXISTS "Log" CASCADE;
DROP TABLE IF EXISTS "RefreshToken" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "MediaType" CASCADE;

-- Enum 타입
CREATE TYPE "Role" AS ENUM ('OWNER', 'MEMBER');
CREATE TYPE "MediaType" AS ENUM ('VIDEO', 'IMAGE');

-- User
CREATE TABLE "User" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "email"        TEXT NOT NULL UNIQUE,
  "username"     TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "avatarUrl"    TEXT,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "User_email_idx" ON "User"("email");

-- RefreshToken
CREATE TABLE "RefreshToken" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "token"     TEXT NOT NULL UNIQUE,
  "userId"    TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- Log
CREATE TABLE "Log" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "name"        TEXT NOT NULL,
  "inviteCode"  TEXT NOT NULL UNIQUE,
  "maxMembers"  INT NOT NULL DEFAULT 12,
  "createdById" TEXT NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Log_inviteCode_idx" ON "Log"("inviteCode");

-- LogMember
CREATE TABLE "LogMember" (
  "id"       TEXT NOT NULL PRIMARY KEY,
  "logId"    TEXT NOT NULL REFERENCES "Log"("id") ON DELETE CASCADE,
  "userId"   TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "role"     "Role" NOT NULL DEFAULT 'MEMBER',
  "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("logId", "userId")
);
CREATE INDEX "LogMember_logId_idx" ON "LogMember"("logId");
CREATE INDEX "LogMember_userId_idx" ON "LogMember"("userId");

-- Post
CREATE TABLE "Post" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "authorId"     TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "logId"        TEXT REFERENCES "Log"("id") ON DELETE CASCADE,
  "mediaUrl"     TEXT NOT NULL,
  "mediaType"    "MediaType" NOT NULL,
  "thumbnailUrl" TEXT,
  "caption"      TEXT,
  "takenAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Post_logId_takenAt_idx" ON "Post"("logId", "takenAt");
CREATE INDEX "Post_authorId_takenAt_idx" ON "Post"("authorId", "takenAt");

-- Like
CREATE TABLE "Like" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "postId"    TEXT NOT NULL REFERENCES "Post"("id") ON DELETE CASCADE,
  "userId"    TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("postId", "userId")
);
CREATE INDEX "Like_postId_idx" ON "Like"("postId");

-- Comment
CREATE TABLE "Comment" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "postId"    TEXT NOT NULL REFERENCES "Post"("id") ON DELETE CASCADE,
  "authorId"  TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "content"   TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "Comment_postId_createdAt_idx" ON "Comment"("postId", "createdAt");

-- Prisma migration 상태 테이블 (prisma generate 호환용)
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                  TEXT NOT NULL PRIMARY KEY,
  "checksum"            TEXT NOT NULL,
  "finished_at"         TIMESTAMPTZ,
  "migration_name"      TEXT NOT NULL,
  "logs"                TEXT,
  "rolled_back_at"      TIMESTAMPTZ,
  "started_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "applied_steps_count" INT NOT NULL DEFAULT 0
);
