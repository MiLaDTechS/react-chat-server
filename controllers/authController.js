const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");

const User = require('../models/User');

// Display list of all Authors.
exports.user_login_post = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).exec();

        if (user && bcrypt.compareSync(password, user.password)) {
            if (user.emailConfirmed) {
                const token = jwt.sign({ id: user.id, email: user.email, nickname: user.nickname }, process.env.JWT_SECRET, { expiresIn: '1h' })
                res.json({ id: user.id, email: user.email, nickname: user.nickname, token });
            } else {
                res.status(401).json({ message: 'Email is not confirmed yet' })
            }
        } else {
            res.status(403).json({ message: 'Email or password is wrong' });
        }
    } catch (error) {
        res.status(500).json(error);
    }
}

// Display detail page for a specific Author.
exports.user_register_post = async (req, res) => {
    const { nickname, password, email } = req.body;

    try {
        const userExist = await User.exists({ email });

        if (userExist) {
            res.status(409).json({ userExist, message: `Email is already taken` })
        } else {
            const user = await User.create({ nickname, password, email });

            // create reusable transporter object using the default SMTP transport
            let transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true, // true for 465, false for other ports
                auth: {
                    user: process.env.SENDINBLUE_USERNAME, // generated ethereal user
                    pass: process.env.SENDINBLUE_PASSWORD, // generated ethereal password
                },
            });

            // send mail with defined transport object
            let info = await transporter.sendMail({
                from: '"Ghost Chat 👻" <auth@ghostchat.com>', // sender address
                to: email, // list of receivers
                subject: "Email Confirm", // Subject line
                html: `
                    <h4>Click the link below to activate your account</h4>
                    <a href="${process.env.NODE_ENV !== 'development' ? process.env.CLIENT_PRODUCTION_URL : process.env.CLIENT_DEVELOPMENT_URL}/confirmemail?token=${jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' })}" target="_blank">Activation Link</a>
                `, // html body
            });

            res.json(info);
        }

    } catch (error) {
        console.log(error);
        res.status(500).json(error)
    }
}

// Display Author create form on GET.
exports.user_confirmEmail_post = async (req, res) => {
    const decodedToken = req.user;

    try {
        if (decodedToken && decodedToken.id) {
            const result = await User.updateOne({ _id: decodedToken.id }, { emailConfirmed: true });

            if (result.n > 0) {
                if (result.nModified > 0) {
                    res.json({ emailConfirmed: true, message: 'Your email confirmed successfully, you will be redirected to login page shortly' });
                } else {
                    res.json({ message: 'Your email is already confirmed' });
                }
            } else {
                res.status(404).json({ message: 'User does not exist' })
            }
        }
    } catch (error) {
        res.status(500).json(error)
    }
}
