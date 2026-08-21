import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDirectory = path.resolve(
  "uploads/messages",
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    const safeName =
      file.originalname.replace(
        /[^a-zA-Z0-9._-]/g,
        "_",
      );

    const filename = `${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}-${safeName}`;

    callback(null, filename);
  },
});

const allowedExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",

  ".mp4",

  ".pdf",
  ".txt",
  ".csv",
  ".ics",

  ".zip",

  ".doc",
  ".docx",

  ".xls",
  ".xlsx",

  ".ppt",
  ".pptx",
];

const fileFilter = (
  req,
  file,
  callback,
) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  if (
    allowedExtensions.includes(
      extension,
    )
  ) {
    callback(null, true);
  } else {
    callback(
      new Error(
        `Unsupported file type: ${extension}`,
      ),
      false,
    );
  }
};

const messageUpload = multer({
  storage,

  limits: {
    fileSize: 15 * 1024 * 1024,
  },

  fileFilter,
});

export default messageUpload;