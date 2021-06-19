const { model, Schema } = require("mongoose");
const bcrypt = require("bcrypt");

const setPassword = (value) => {
    return value ? bcrypt.hashSync(value, 10) : '';
}

const UserSchema = Schema({
    nickname: String,
    password: {
        type: String,
        required: [true, 'Password is required'],
        set: setPassword
    },
    email: {
        type: String,
        required: [true, 'Email is required']
    },
    emailConfirmed: {
        type: Boolean,
        default: false
    },
    registerDate: {
        type: Date,
        default: new Date()
    },
    isActive: {
        type: Boolean,
        default: false
    }
});

module.exports = model("Users", UserSchema);
