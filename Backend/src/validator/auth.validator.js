import { body, validationResult } from "express-validator";



  export function validate(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    next();
  }



export const registerValidator = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("username is required")
    .isLength({ min: 3, max: 20 })
    .withMessage("username must be between 3 and 20 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage(
      "username can only contain letters, numbers, and underscore"
    ),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("invalid email")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 6 })
    .withMessage("password must be at least 6 characters")
    .matches(/[A-Z]/)
    .withMessage("password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("password must contain at least one number"),

    validate
];

export const loginValidator = [
  body("email")
    .trim() 
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("invalid email")
    .normalizeEmail(),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("password is required") ,
    validate
];



