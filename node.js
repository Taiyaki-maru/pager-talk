const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');

const authRouter = require('./routes/auth');
const apiRouter = require('./routes/api');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// ルーティング適用
app.use('/', authRouter);
app.use('/api', apiRouter);

// ルート階層アクセス時のリダイレクト制御
app.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/talks');
  }
  res.redirect('/login');
});

// 各画面プレースホルダー (Phase 4でPugテンプレート作成)
app.get('/talks', requireAuth, (req, res) => {
  res.render('talks', { user: req.session });
});

app.get('/chat/:id', requireAuth, (req, res) => {
  res.render('chat', { user: req.session, targetId: req.params.id });
});

app.get('/dictionary', requireAuth, (req, res) => {
  res.render('dictionary', { user: req.session });
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});