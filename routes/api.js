const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { requireAuth } = require('../middleware/auth');

// 全APIで認証を要求
router.use(requireAuth);

// 1. トーク一覧（未読バッジ●判定・最新メッセージ付き）
router.get('/talks', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const users = await prisma.user.findMany({
      where: { id: { not: currentUserId } },
      select: { id: true, userId: true, displayName: true }
    });

    const talks = await Promise.all(
      users.map(async (user) => {
        const latestMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: currentUserId, receiverId: user.id },
              { senderId: user.id, receiverId: currentUserId }
            ]
          },
          orderBy: { createdAt: 'desc' }
        });

        const unreadCount = await prisma.message.count({
          where: {
            senderId: user.id,
            receiverId: currentUserId,
            isRead: false
          }
        });

        return {
          user,
          latestMessage: latestMessage ? latestMessage.numberText : null,
          hasUnread: unreadCount > 0
        };
      })
    );

    res.json(talks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'トーク一覧の取得に失敗しました。' });
  }
});

// 2. メッセージ履歴取得（開いたメッセージを自動的に既読化）
router.get('/messages/:receiverId', async (req, res) => {
  const currentUserId = req.session.userId;
  const targetUserId = parseInt(req.params.receiverId, 10);

  if (isNaN(targetUserId)) {
    return res.status(400).json({ error: '不正なユーザーIDです。' });
  }

  try {
    // 相手からの未読メッセージを既読に更新
    await prisma.message.updateMany({
      where: {
        senderId: targetUserId,
        receiverId: currentUserId,
        isRead: false
      },
      data: { isRead: true }
    });

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: currentUserId }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'メッセージの取得に失敗しました。' });
  }
});

// 3. メッセージ送信 (厳密な16桁数字バリデーション)
router.post('/messages', async (req, res) => {
  const currentUserId = req.session.userId;
  const { receiverId, numberText } = req.body;
  const targetUserId = parseInt(receiverId, 10);

  // 1〜16桁の半角数字制限
  const numberRegex = /^[0-9]{1,16}$/;
  if (!numberText || !numberRegex.test(numberText)) {
    return res.status(400).json({ error: 'メッセージは半角数字1〜16桁で入力してください。' });
  }

  if (isNaN(targetUserId)) {
    return res.status(400).json({ error: '送信先ユーザーが不正です。' });
  }

  try {
    const newMessage = await prisma.message.create({
      data: {
        senderId: currentUserId,
        receiverId: targetUserId,
        numberText
      }
    });
    res.status(201).json(newMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'メッセージの送信に失敗しました。' });
  }
});

// 4. マイ辞書一覧取得
router.get('/dictionary', async (req, res) => {
  try {
    const currentUserId = req.session.userId;
    const dictionaries = await prisma.dictionary.findMany({
      where: { userId: currentUserId },
      orderBy: { id: 'asc' }
    });
    res.json(dictionaries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '辞書の取得に失敗しました。' });
  }
});

// 5. マイ辞書追加
router.post('/dictionary', async (req, res) => {
  const currentUserId = req.session.userId;
  const { code, label } = req.body;

  const numberRegex = /^[0-9]{1,16}$/;
  if (!code || !numberRegex.test(code)) {
    return res.status(400).json({ error: '数字コードは半角数字1〜16桁で入力してください。' });
  }
  if (!label || label.trim() === '') {
    return res.status(400).json({ error: '意味を入力してください。' });
  }

  try {
    const newItem = await prisma.dictionary.create({
      data: {
        userId: currentUserId,
        code,
        label: label.trim()
      }
    });
    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '辞書の追加に失敗しました。' });
  }
});

// 6. マイ辞書削除
router.delete('/dictionary/:id', async (req, res) => {
  const currentUserId = req.session.userId;
  const dictId = parseInt(req.params.id, 10);

  if (isNaN(dictId)) {
    return res.status(400).json({ error: '不正なIDです。' });
  }

  try {
    await prisma.dictionary.deleteMany({
      where: {
        id: dictId,
        userId: currentUserId
      }
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '辞書の削除に失敗しました。' });
  }
});

module.exports = router;