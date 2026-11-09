const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ログイン画面の表示
router.get('/login', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/talks');
  }
  res.render('login', { error: null });
});

// ログイン実行処理
router.post('/login', async (req, res) => {
  const { userId, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) {
      return res.render('login', { error: 'IDまたはパスワードが正しくありません。' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.render('login', { error: 'IDまたはパスワードが正しくありません。' });
    }

    // セッション固定化攻撃（Session Fixation）の対策として再生成
    req.session.regenerate((err) => {
      if (err) {
        return res.render('login', { error: 'ログイン処理中にエラーが発生しました。' });
      }
      req.session.userId = user.id;
      req.session.userLoginId = user.userId;
      req.session.displayName = user.displayName;
      res.redirect('/talks');
    });
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'サーバーエラーが発生しました。' });
  }
});

// ログアウト処理
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;