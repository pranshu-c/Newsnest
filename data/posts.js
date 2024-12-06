const mongoose = require("mongoose");

mongoose.connect('mongodb+srv://elite-p:<98709870>@newzbuddy1.v4eu1.mongodb.net/Newzbuddy?retryWrites=true&w=majority&appName=newzbuddy1', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));


const postSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    tags: {
        type: [String], // Array of strings for hashtags
        default: [],
    },
    // Field referencing user who posted the article
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    // Array of user IDs who liked the post
    likes: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'users',
        default: []
    },
    // Array of comments, each comment can have text, user, and timestamp
    comments: [{
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'users',
            required: true 
        },
        likes: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'users',
            default: []
        },
        text: {
            type: String,
            required: true,
            trim: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Path to the image or file for the article
    filePath: {
        type: String,
        required: true
    },
    // Profile picture of the user
    profilePic: {
        type: String,
    },
    // Timestamp when the post was created
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Export the model
module.exports = mongoose.model('posts', postSchema);
