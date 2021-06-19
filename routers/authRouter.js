const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authenticate = require('../middlewares/authenticate');

// middleware that is specific to this router
// router.use(function timeLog(req, res, next) {
//     console.log('Time: ', Date.now())
//     next()
// })

router.post("/login", authController.user_login_post);

router.post("/register", authController.user_register_post);

router.post('/confirmemail', authenticate, authController.user_confirmEmail_post);

module.exports = router