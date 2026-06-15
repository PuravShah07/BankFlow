const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/.+@.+\..+/, 'Please enter a valid email address'],
        unique: [true, 'Email already exists'],
        trim: true,
        lowercase: true
    },
    name: {
        type: String,
        required: [true, 'Name is required']
    },

    password: {
        type: String,
        required: [true, 'Password is required'],
        minLength: [10, 'Password must be at least 10 characters long'],
        select: false // bydefault password is not select 
    }
},{
    timestamps: true,
});

// bcrypt hashing middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return;
    }
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (userPass){
    
    return await bcrypt.compare(userPass, this.password);

}



const User = mongoose.model('User', userSchema);
module.exports = User;


