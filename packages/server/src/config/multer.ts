import multer from 'multer';

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('이미지 또는 영상 파일만 업로드할 수 있습니다.'));
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});
