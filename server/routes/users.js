// routes/users.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  getProfile,
  updateProfile,
  getUserProfile,
  addExperience,
  addEducation,
  deleteExperience,
  deleteEducation
} = require('../controllers/userController');

const {
  getCompanies,
  getCompanyById
} = require('../controllers/companyController');

const { protect, authorize } = require('../middleware/auth');

// Set up storage for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    let uploadPath = '';
    
    if (file.fieldname === 'profileImage' || file.fieldname === 'companyLogo') {
      uploadPath = path.join(__dirname, '../public/uploads/profiles');
    } else if (file.fieldname === 'resume') {
      uploadPath = path.join(__dirname, '../public/uploads/resumes');
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    const userId = req.user.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${timestamp}${ext}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept images and documents
  if (file.fieldname === 'profileImage' || file.fieldname === 'companyLogo') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  } else if (file.fieldname === 'resume') {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, or DOCX files are allowed!'), false);
    }
  } else {
    cb(null, false);
  }
};

// Initialize multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});



// In your routes/users.js file
// Add error handling middleware for multer
const multerErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        message: `Multer error: ${err.message}`,
        code: err.code
      });
    } else if (err) {
      return res.status(400).json({
        message: `Error in file upload: ${err.message}`
      });
    }
    next();
  };
  
// In routes/users.js - remove all multer-related code
router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);

  
// Company routes
router.get('/companies', getCompanies);
router.get('/companies/:id', getCompanyById);

router.get('/:id', getUserProfile);

// Experience routes
router.route('/experience')
  .put(protect, authorize('jobseeker'), addExperience);

router.delete('/experience/:exp_id', protect, authorize('jobseeker'), deleteExperience);

// Education routes
router.route('/education')
  .put(protect, authorize('jobseeker'), addEducation);

router.delete('/education/:edu_id', protect, authorize('jobseeker'), deleteEducation);

module.exports = router;