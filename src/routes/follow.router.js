import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();

router.post("/follow", authMiddleware, async (req, res, next) => {
  const followerId = req.body;
  const { userId } = req.user;

  if (!followerId)
    return res
      .status(400)
      .json({ message: "follow하려는 유저의 정보가 올바르지 않습니다." });

  const user = await prisma.users.findFirst({
    where: { userId: +userId },
  });

  if (!user) {
    return res.status(400).json({ message: "유저 정보가 올바르지 않습니다." });
  }

  const checkFollow = await prisma.follow.findMany({
    where: {
      and: [{ followerId: +followerId }, { followingId: user.userId }],
    },
  });

  if (checkFollow) {
    await prisma.follow.delete({
      where: {
        and: [{ followerId: +followerId }, { followingId: user.userId }],
      },
    });
    return res.status(200).json({ message: "언팔로우 되었습니다!" });
  }

  await prisma.follow.create({
    data: {
      followerId: +followerId,
      followingId: user.userId,
    },
  });

  return res
    .status(200)
    .json({ message: `${user.name}님을 팔로우 하셨습니다!` });
});

router.get("/follow/:userId", authMiddleware, async (req, res, next) => {
  const userId = req.params;
  const myUser = req.user;

  const user = await prisma.users.findFirst({
    where: { userId: +userId },
  });

  if (!user)
    return res.status(400).json({ message: "유저 정보가 올바르지 않습니다." });

  if (user.locked === "lock") {
    const checkFollower = await prisma.follow.findMany({
      where: {
        or: [
          { and: [{ followerId: user.userId }, { followingId: myUser }] },
          { and: [{ followerId: myUser }, { followingId: user.userId }] },
        ],
      },
    });

    if (checkFollower.length !== 2) {
      return res.status(400).json({
        message:
          "이 유저의 follow정보는 비공개입니다. 열람하시려면 서로 follow한 상태이어야 합니다.",
      });
    }
    // 작성 중...
  }
});
