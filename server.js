import express from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"))); // files
app.use("/assets", express.static(path.join(__dirname, "assets"))); // assets
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // pics

// Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// mongoDB Connection
mongoose
  .connect(
    "mongodb+srv://dev:150733@users.3z59scr.mongodb.net/?retryWrites=true&w=majority&appName=users",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log(" Connected to MongoDB"))
  .catch((err) => console.error(" MongoDB connection error:", err));

// User Schema , Model
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // username
    email: { type: String, required: true, unique: true }, // email
    age: { type: String, required: true }, // age
    avatar: { type: String }, // pic
    password: { type: String, required: true }, //password
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

//  Register 
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.post("/register", upload.single("avatar"), async (req, res) => {
  try {
    const { name, email, age, password } = req.body;

    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.status(400).send("Email already exists ");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = req.file ? `/uploads/${req.file.filename}` : null;

    const newUser = new User({
      name,
      email,
      age,
      avatar,
      password: hashedPassword,
    });
    await newUser.save();

    res.status(201).send("Register success ");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

//  login
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).send("Wrong Email or Password ");

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch)
      return res.status(400).send("Wrong Email or Password ");

    res.status(200).send("Login success ");
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// others

app.get("/settings", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "settings.html"));
});
app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "about.html"));
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
