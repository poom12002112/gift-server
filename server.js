const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 確保上傳目錄存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/gift-exchange')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });

// Models
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phoneNumber: String,
  isAdmin: { type: Boolean, default: false } // 添加 isAdmin 字段
}));

const Gift = mongoose.model('Gift', new mongoose.Schema({
  name: String,
  description: String,
  level: String,
  mode: String, // 新增 mode 字段
  storeNumber: String, // 新增 storeNumber 字段
  phoneNumber: String, // 新增 phoneNumber 字段
  amount: Number, // 新增 amount 字段
  url: String, // 新增 url 字段
  image: String,
  userId: mongoose.Schema.Types.ObjectId,
}, { timestamps: true }));

const Announcement = mongoose.model('Announcement', new mongoose.Schema({
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now }
}));

const ExchangeDate = mongoose.model('ExchangeDate', new mongoose.Schema({
  dateTime: Date
}));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the Gift Exchange Platform API');
});

// User routes
app.get('/users', async (req, res) => {
  const users = await User.find();
  res.send(users);
});

app.post('/users', async (req, res) => {
  const { name, email, password } = req.body;

  // 檢查是否已經存在相同的 email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).send('Email already registered');
  }

  const user = new User({ name, email, password });
  await user.save();
  res.send(user);
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (!user) {
    return res.status(401).send('Invalid credentials');
  }
  res.send(user);
});

app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password, phoneNumber, isAdmin } = req.body;
  const user = await User.findByIdAndUpdate(id, { name, email, password, phoneNumber, isAdmin }, { new: true });
  if (!user) {
    return res.status(404).send('User not found');
  }
  res.send(user);
});

app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    return res.status(404).send('User not found');
  }
  res.send(user);
});

// Announcement routes
app.get('/announcements', async (req, res) => {
    const announcements = await Announcement.find();
    res.send(announcements);
  });
  
  app.post('/announcements', async (req, res) => {
    const { title, content } = req.body;
    const announcement = new Announcement({ title, content });
    await announcement.save();
    res.send(announcement);
  });
  
  app.put('/announcements/:id', async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const announcement = await Announcement.findByIdAndUpdate(id, { title, content }, { new: true });
    if (!announcement) {
      return res.status(404).send('Announcement not found');
    }
    res.send(announcement);
  });
  
  app.delete('/announcements/:id', async (req, res) => {
    const { id } = req.params;
    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
      return res.status(404).send('Announcement not found');
    }
    res.send(announcement);
  });

// Gift routes
app.get('/gifts', async (req, res) => {
  const gifts = await Gift.find();
  res.send(gifts);
});

app.post('/gifts', upload.single('image'), async (req, res) => {
  const { name, description, level, mode, storeNumber, phoneNumber, amount, url, userId } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : '';
  const gift = new Gift({ name, description, level, mode, storeNumber, phoneNumber, amount, url, image, userId });
  await gift.save();
  res.send(gift);
});

app.put('/gifts/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { name, description, level, mode, storeNumber, phoneNumber, amount, url, userId } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : '';
  const gift = await Gift.findByIdAndUpdate(id, { name, description, level, mode, storeNumber, phoneNumber, amount, url, image, userId }, { new: true });
  if (!gift) {
    return res.status(404).send('Gift not found');
  }
  res.send(gift);
});

app.delete('/gifts/:id', async (req, res) => {
  const { id } = req.params;
  const gift = await Gift.findByIdAndDelete(id);
  if (!gift) {
    return res.status(404).send('Gift not found');
  }
  res.send(gift);
});

app.post('/set-exchange-date', async (req, res) => {
  const { dateTime } = req.body;
  await ExchangeDate.deleteMany(); // 清除之前的日期
  const exchangeDate = new ExchangeDate({ dateTime });
  await exchangeDate.save();
  res.send(exchangeDate);
});

app.get('/get-exchange-date', async (req, res) => {
  const exchangeDate = await ExchangeDate.findOne();
  res.send(exchangeDate);
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});