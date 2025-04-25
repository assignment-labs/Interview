const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

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
// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
      // Fields to update based on role
      const updateFields = {};
      
      // Common fields for both roles
      const commonFields = ['name', 'email', 'phone', 'bio', 'location'];
      commonFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateFields[field] = req.body[field];
        }
      });
      
      // Handle skills array
      if (req.body.skills) {
        try {
          updateFields.skills = JSON.parse(req.body.skills);
        } catch (err) {
          // If parsing fails, assume it's a comma-separated string
          if (typeof req.body.skills === 'string') {
            updateFields.skills = req.body.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
          }
        }
      }
      
      // Handle social media data
      const socialFields = ['linkedin', 'twitter', 'facebook', 'instagram'];
      if (socialFields.some(field => req.body[field])) {
        updateFields.socialMedia = {};
        socialFields.forEach(field => {
          if (req.body[field]) {
            updateFields.socialMedia[field] = req.body[field];
          }
        });
      }
      
      // Handle file uploads with express-fileupload
      if (req.files) {
        // Create upload directories if they don't exist
        const profilesDir = path.join(__dirname, '../public/uploads/profiles');
        const resumesDir = path.join(__dirname, '../public/uploads/resumes');
        
        if (!fs.existsSync(profilesDir)) {
          fs.mkdirSync(profilesDir, { recursive: true });
        }
        
        if (!fs.existsSync(resumesDir)) {
          fs.mkdirSync(resumesDir, { recursive: true });
        }
        
        // Handle profile image
        if (req.files.profileImage) {
          const file = req.files.profileImage;
          const fileName = `${req.user.id}-${Date.now()}${path.extname(file.name)}`;
          const uploadPath = path.join(profilesDir, fileName);
          
          // Move the file
          await file.mv(uploadPath);
          updateFields.profileImage = `uploads/profiles/${fileName}`;
          
          // Delete old file if exists
          const user = await User.findById(req.user.id);
          if (user.profileImage) {
            const oldPath = path.join(__dirname, '../public', user.profileImage);
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
          }
        }
        
        // Handle company logo
        if (req.files.companyLogo) {
          const file = req.files.companyLogo;
          const fileName = `${req.user.id}-${Date.now()}${path.extname(file.name)}`;
          const uploadPath = path.join(profilesDir, fileName);
          
          // Move the file
          await file.mv(uploadPath);
          updateFields.companyLogo = `uploads/profiles/${fileName}`;
          
          // Delete old file if exists
          const user = await User.findById(req.user.id);
          if (user.companyLogo) {
            const oldPath = path.join(__dirname, '../public', user.companyLogo);
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
          }
        }
        
        // Handle resume
        if (req.files.resume) {
          const file = req.files.resume;
          const fileName = `${req.user.id}-${Date.now()}${path.extname(file.name)}`;
          const uploadPath = path.join(resumesDir, fileName);
          
          // Move the file
          await file.mv(uploadPath);
          updateFields.resume = `uploads/resumes/${fileName}`;
          
          // Delete old file if exists
          const user = await User.findById(req.user.id);
          if (user.resume) {
            const oldPath = path.join(__dirname, '../public', user.resume);
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
          }
        }
      }
      
      // Role-specific fields
      if (req.user.role === 'jobseeker') {
        // Job seeker specific fields handled in separate endpoints
      } else if (req.user.role === 'employer') {
        // Employer specific fields
        const employerFields = ['companyName', 'companyDescription', 'website', 'industry'];
        employerFields.forEach(field => {
          if (req.body[field] !== undefined) {
            updateFields[field] = req.body[field];
          }
        });
      }
      
      // Find and update user
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updateFields },
        { new: true, runValidators: true }
      );
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (err) {
      console.error('Profile update error:', err);
      res.status(500).json({
        message: 'Server Error',
        error: err.message
      });
    }
  };

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get public profile of a user
// @route   GET /api/users/:id
// @access  Public
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    
    if (!user) {
      return res.status(404).json({
        message: `User not found with ID: ${req.params.id}`
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Add experience to profile
// @route   PUT /api/users/experience
// @access  Private (Job seeker only)
exports.addExperience = async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        message: 'Only job seekers can add experience'
      });
    }
    
    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;
    
    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    };
    
    const user = await User.findById(req.user.id);
    
    user.experience.unshift(newExp);
    
    await user.save();
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Add experience error:', err);
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Add education to profile
// @route   PUT /api/users/education
// @access  Private (Job seeker only)
exports.addEducation = async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        message: 'Only job seekers can add education'
      });
    }
    
    const {
      school,
      degree,
      fieldOfStudy,
      from,
      to,
      current,
      description
    } = req.body;
    
    const newEdu = {
      school,
      degree,
      fieldOfStudy,
      from,
      to,
      current,
      description
    };
    
    const user = await User.findById(req.user.id);
    
    user.education.unshift(newEdu);
    
    await user.save();
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Add education error:', err);
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Delete experience from profile
// @route   DELETE /api/users/experience/:exp_id
// @access  Private (Job seeker only)
exports.deleteExperience = async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        message: 'Only job seekers can delete experience'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    // Get remove index
    const removeIndex = user.experience
      .map(item => item.id)
      .indexOf(req.params.exp_id);
    
    if (removeIndex === -1) {
      return res.status(404).json({
        message: 'Experience not found'
      });
    }
    
    user.experience.splice(removeIndex, 1);
    
    await user.save();
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Delete experience error:', err);
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Delete education from profile
// @route   DELETE /api/users/education/:edu_id
// @access  Private (Job seeker only)
exports.deleteEducation = async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        message: 'Only job seekers can delete education'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    // Get remove index
    const removeIndex = user.education
      .map(item => item.id)
      .indexOf(req.params.edu_id);
    
    if (removeIndex === -1) {
      return res.status(404).json({
        message: 'Education not found'
      });
    }
    
    user.education.splice(removeIndex, 1);
    
    await user.save();
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Delete education error:', err);
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
};