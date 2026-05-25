import prisma from "./prisma";


async function saveToken(userId: number, token: string, expiresAt: Date) {
  await deleteUserTokens(userId); 
  
  return await prisma.refreshToken.create({
    data: { user_id, token, expires_at },
  });
}

async function findToken(token: string) {
  return await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });
}

async function deleteToken(token: string) {
  return await prisma.refreshToken.delete({
    where: { token },
  });
}

async function deleteUserTokens(userId: number) {
  return await prisma.refreshToken.deleteMany({
    where: { user_id },
  });
}

export default {
  saveToken,
  findToken,
  deleteToken,
  deleteUserTokens,
} as const;