import bcrypt from "bcrypt";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: false,
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
  },

  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
  },

  firstName: {
    type: String,
    required: false,
    trim: true,
  },

  lastName: {
    type: String,
    required: false,
    trim: true,
  },

  image: {
    type: String,
    required: false,
    default: null,
  },

  color: {
    type: Number,
    required: false,
    default: 0,
  },

  profileSetup: {
    type: Boolean,
    default: false,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", userSchema);

export default User;