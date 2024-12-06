const mongoose = require("mongoose")
const plm = require("passport-local-mongoose")
const { stringify } = require("uuid")

mongoose.connect('mongodb+srv://elite-p:98709870@newzbuddy1.v4eu1.mongodb.net/?retryWrites=true&w=majority&appName=newzbuddy1')


let userSchema = mongoose.Schema({
    username: String,
    name: String,
    email: String,
    password: String,
    profilepic:String,
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'posts' }],
    likedPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'posts',
        likedAt: Date.now
    }],
    savedPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'posts'
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }],
    filepath: String,
    contact: String
})

userSchema.plugin(plm)

module.exports = mongoose.model('users', userSchema)
