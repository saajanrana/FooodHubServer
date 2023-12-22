// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/FooodHub', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define User model
const User = mongoose.model('User', {
  fullName: { type: String, required: true, validate: /^[a-zA-Z]{3,}$/ },
  email: { type: String, required: true, unique: true, validate: /^\S+@\S+\.\S+$/ },
  password: { type: String, required: true, validate: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/ },
  phone:{type:String},
  address:{type:String},
  imgurl:{type:String}
});

// Middleware
app.use(bodyParser.json());
app.use(cors());


// jwt 
const generateToken = (user) => {
  return jwt.sign({ userId: user._id }, "your_secret_key", { expiresIn: "10h" });
};



// Registration endpoint with enhanced validation and error messages

app.post('/api/register', async (req, res) => {
  const { fullName, email, password } = req.body;

  // Enhanced validation with error messages
  const errors = {};

  if (!fullName || !fullName.match(/^[a-zA-Z]{3,}$/)) {
    errors.fullName = 'Name must be at least 3 characters long and contain only letters.';
  }

  if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
    errors.email = 'Invalid email format.';
  }

  if (!password || !password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/)) {
    errors.password = 'Password must be at least 6 characters long with at least one lowercase letter, one uppercase letter, and one digit.';
  }



  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Create a new user with enhanced validation
    const newUser = new User({ fullName, email, password });
    await newUser.save();
    const token = generateToken(newUser);

    res.status(201).json({ message: 'User registered successfully.' ,token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


//login

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
  
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
  
    try {
      // Find the user by email
      const user = await User.findOne({ email });
     
  
      // Check if the user exists
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }
  
      // Check if the password is correct
      const isPasswordValid = user.password === password; // Note: You should use bcrypt for secure password storage and comparison
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const token = generateToken(user);
  
      // If email and password are valid, send success message
      res.status(200).json({ message: 'Login successful.',token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  });



  // /// validation

  // const validateTokenAndGetUserId = (token) => {
  //   try {
  //     const decodedToken = jwt.verify(token, "your_secret_key");
  //     return decodedToken.userId;
  //   } catch (error) {
  //     return null;
  //   }
  // };

  // //authentication
  
  
  // const authenticateToken = (req, res, next) => {
  //   const bearerheader = req.headers["authorization"];
  //   console.log("barere>>>>>>>>", bearerheader);
  //   const bearer = bearerheader.split(" ");
  
  //   const token = bearer[1];
  //   console.log("tokennnnn>>>>", token);
  //   if (!token)
  //     return res
  //       .status(401)
  //       .json({ success: false, message: "Token not provided" });
  
  //   jwt.verify(token, "your_secret_key", (err, user) => {
  //     if (err)
  //       return res.status(403).json({ success: false, message: "Invalid token" });
  //     req.user = user;
  //     next();
  //   });
  // };
app.get('/api/profile', async (req, res) => {
  const token = req.headers.authorization;

  console.log('token>>>>>>>',token);

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized - Token missing.' });
  }

  try {
    // Verify the token
    const decodedToken = jwt.verify(token,"your_secret_key");
    console.log('decode????????',decodedToken);

    // Find the user by ID from the token
    const user = await User.findById(decodedToken.userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Return user details
    res.status(200).json({
      fullName: user?.fullName,
      email: user?.email,
      phoneNumber: user?.phoneNumber,
      image: user?.image,
      address: user?.address
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Unauthorized - Invalid token.' });
  }
});













// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
