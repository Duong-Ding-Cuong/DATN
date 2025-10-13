const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: [true, 'Username là bắt buộc'], 
        unique: true,
        trim: true,
        minlength: [2, 'Username phải có ít nhất 2 ký tự']
    },
    email: { 
        type: String, 
        required: [true, 'Email là bắt buộc'], 
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
    },
    password: { 
        type: String, 
        required: [true, 'Password là bắt buộc'],
        minlength: [6, 'Password phải có ít nhất 6 ký tự']
    },
    role: { 
        type: String, 
        default: "user",
        enum: ['user', 'admin']
    },
    created_at: { 
        type: Date, 
        default: Date.now 
    },
    last_login: {
        type: Date
    }
}, {
    timestamps: true // Tự động thêm createdAt và updatedAt
});


const AccountModel = mongoose.model('users', accountSchema);

module.exports = AccountModel;