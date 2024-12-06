const express = require("express")
const app = express()
const fs = require('fs');
const path = require('path');
const flash = require("connect-flash")
const userModel = require("../data/user")
const postModel = require("../data/posts")
const passport = require("passport")
const session = require("express-session")
const LocalStrategy = require("passport-local")
const uploadpp = require("../data/multerpp")
const upload = require("../data/multer");
const posts = require("../data/posts");
const {
    promisify
} = require('util');
const {
    isSymbolObject
} = require("util/types");
const { connect } = require("http2");
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');

// Extend Day.js with the relativeTime plugin
dayjs.extend(relativeTime);



app.set("view engine", "ejs"); //set the view engine to ejs so that it can render it 


app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: "she is cute"
}));

// Middleware to pass flash messages to all views
app.use(flash());
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        // Find the user by username
        let user = await userModel.findOne({
            username: username
        });

        // If user not found, show incorrect username error
        if (!user) {
            return done(null, false, {
                message: 'Incorrect username'
            });
        }

        // Correct usage of authenticate function
        userModel.authenticate()(username, password, function (err, user, options) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {
                    message: options.message
                }); // Passport-local-mongoose provides the message
            }
            return done(null, user);
        });
    } catch (error) {
        return done(error);
    }
}));

passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());


app.get("/", (req, res) => {
    res.render("register")
})

app.post("/register", async (req, res) => {
    try {
        // Check if the username already exists
        let existingUser = await userModel.findOne({
            username: req.body.username
        });
        if (existingUser) {
            req.flash("error", "Username already taken. Please choose another.");
            return res.redirect("/");
        }
        // Check if the password is at least 8 characters long
        if (req.body.password.length < 8) {
            req.flash("error", "Password must be at least 8 characters long.");
            return res.redirect("/");
        }

        // Create new user data
        let userData = new userModel({
            username: req.body.username,
            name: req.body.name,
            email: req.body.email
        });

        // Register the user
        await userModel.register(userData, req.body.password);

        // Authenticate the user and redirect
        passport.authenticate("local")(req, res, function () {
            res.redirect("/home");
        });
    } catch (error) {
        console.error("Error registering user:", error);
        req.flash("error", "An error occurred while registering. Please try again.");
        res.redirect("/register");
    }
});

app.get("/loginpage", (req, res) => {
    res.render("login", {
        error: req.flash("username or password is incorrect")
    });
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/loginpage",
    failureFlash: true
}), (req, res) => {});
//register and login 
////////////////////////////////////////////////////////////////////////////////

app.get("/home", isLoggedIn, (req, res) => {
    res.render("index", {
        currentPage: 'home'
    });
});

app.get('/cmt',(req,res)=>{
    res.render('comments')
})

app.get("/explore", isLoggedIn, (req, res) => {
    res.render("explore", {
        currentPage: 'explore'
    });
});

app.get("/addyours", (req, res) => {
    res.render("addyours")
})

app.get("/flicks", isLoggedIn, (req, res) => {
    res.render("articleview", {
        currentPage: 'flicks'
    });
});

app.get("/editprofile", isLoggedIn, async (req, res) => {
    let userProfile = await userModel.findOne({
        username: req.session.passport.user
    })
    res.render("editpage", {
        userProfile
    });
})

app.get('/highlites', isLoggedIn, (req, res) => {
    res.render("highlites")
})


app.get("/notifications", isLoggedIn, (req, res) => {
    res.render("notification")
})

app.get("/edit", isLoggedIn, (req, res) => {
    res.redirect("/profile")
})

app.get("/articleview", isLoggedIn, (req, res) => {
    res.render("articleview")
})


//code for handleling of profile pictures
app.post("/uploadpp", isLoggedIn, uploadpp.single('file'), async function (req, res) {
    try {
        if (!req.file) {
            return res.status(400).send("No file was uploaded");
        }

        const username = req.session.passport.user;
        let user = await userModel.findOne({
            username
        });

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Check if the user has an existing profile picture
        if (user.profilepic) {
            // Get the full path of the previous profile picture
            const oldProfilePicPath = path.join(__dirname, "..", 'public', user.profilepic);

            // Delete the previous profile picture from the server
            fs.unlink(oldProfilePicPath, (err) => {
                if (err) {
                    console.error("Error deleting old profile picture:", err);
                }
            });
        }

        // Update the user's profile picture
        user.profilepic = `/images/profilepic/${req.file.filename}`;
        await user.save();

        res.redirect("/profile");
    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).send("Error uploading file");
    }
});

//profile update
app.post("/updateprofile", isLoggedIn, uploadpp.single("file"), async (req, res) => {
    try {
        const currentUsername = req.session.passport.user;
        let updates = {};

        // Update the username if provided and different
        if (req.body.username && req.body.username.trim() !== "") {
            const newUsername = req.body.username.trim();
            const existingUser = await userModel.findOne({
                username: newUsername
            });

            if (!existingUser || newUsername === currentUsername) {
                updates.username = newUsername;

                // If the username is changed, update the session
                if (newUsername !== currentUsername) {
                    req.session.passport.user = newUsername;
                }
            } else {
                return res.status(400).send("Username already taken. Please choose a different one.");
            }
        }


        // Update profile picture if a new file is uploaded
        if (req.file) {
            updates.profilepic = `images/profilepic/${req.file.filename}`;
        }

        // Update password if provided and hash it
        if (req.body.password && req.body.password.trim() !== "") {
            const hashedPassword = await bcrypt.hash(req.body.password.trim(), 10); // Assuming you're using bcrypt for hashing
            updates.password = hashedPassword;
        }

        // Only update if there are changes
        if (Object.keys(updates).length > 0) {
            await userModel.findOneAndUpdate({
                    username: currentUsername
                },
                updates, {
                    new: true
                }
            );
        }

        res.redirect("/profile");
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).send("An error occurred while updating your profile.");
    }
});

app.get("/upload-articles", isLoggedIn, (req, res) => {
    res.render("upparticles")
})
//Article upload
app.post('/upparticle', isLoggedIn, upload.single('file'), async (req, res) => {
    try {
        
        // Destructure the fields from req.body
        const {
            title,
            description,
            tags,
            location
        } = req.body;
        
        // Check if any required fields are missing
        if (!title || !description || !tags || !location || !req.file) {
            return res.status(400).json({
                error: 'All fields are required.'
            });
        }
        
        // Create a new post
        const newPost = new postModel({
            username: req.user.username, // Assuming req.user contains the logged-in user's info
            title: title.trim(),
            description: description.trim(),
            tags: tags.split(',').map(tag => tag.trim()), // Convert comma-separated tags into an array
            filePath: `/images/articleimages/${req.file.filename}`, // Store file path relative to 'public/images'
            userid: req.user._id // Store the user ID
        });
        
        // Save the new post to the database
        const uploadedPost = await newPost.save();

        // Find the user and add the post ID to their 'posts' array
        await userModel.findByIdAndUpdate(req.user._id, {
            $push: {
                posts: uploadedPost._id
            } // Assuming the user model has a 'posts' array to store post IDs
        });
        
        // Redirect the user to their profile after successfully uploading the post
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'An error occurred while uploading the article.'
        });
    }
});


app.get("/profile", isLoggedIn, async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.passport || !req.session.passport.user) {
            return res.status(400).send("User not logged in.");
        }

        // Fetch user profile and populate posts and likedPosts
        let userProfile = await userModel
            .findOne({ username: req.session.passport.user })
            .populate({
                path: 'posts',
                options: { sort: { createdAt: -1 } } // Sort posts by creation date in descending order
            })
            .populate('likedPosts')
            .exec();

        // If user profile is not found
        if (!userProfile) {
            return res.status(404).send("User profile not found.");
        }

        // Format the createdAt field for each post using Day.js
        const formattedPosts = userProfile.posts.map(post => ({
            ...post.toObject(), // Convert the Mongoose object to a plain JS object
            createdAtFormatted: dayjs(post.createdAt).fromNow() // Format the date
        }));
    

        // Pass formatted posts and user profile to the template
        res.render("profile", {
            userProfile,
            posts: formattedPosts, // Use the posts with formatted dates
            currentPage: 'profile'
        });

    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).send("An error occurred while fetching the profile.");
    }
});
// Route to fetch user's posts
app.get('/profile/posts', isLoggedIn, async (req, res) => {
    try {
        // Ensure session data exists
        if (!req.session.passport || !req.session.passport.user) {
            return res.status(400).json({
                error: 'User not logged in'
            });
        }

        // Fetch the user's profile based on the session
        let userProfile = await userModel.findOne({
            username: req.session.passport.user
        }).populate({
            path: 'posts',
            options: { sort: { createdAt: -1 } }, 
        });

        // Check if the user profile exists
        if (!userProfile) {
            return res.status(404).json({
                error: 'User profile not found'
            });
        }

        // Format the createdAt field for each post using Day.js
        const formattedPosts = userProfile.posts.map(post => ({
            ...post.toObject(), // Convert the Mongoose object to a plain JS object
            createdAtFormatted: dayjs(post.createdAt).fromNow() // Format the date
        }));

        const userPosts = userProfile.posts || [];

        // Ensure the posts array has the correct data to be sent back
        res.json({
            username: userProfile.username,  // Also send the username
            posts: userPosts,
            formattedPosts
        });
    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({
            error: 'An internal server error occurred'
        });
    }
});
// Get liked posts
app.get('/profile/liked', isLoggedIn, async (req, res) => {
    try {
        // Fetch user profile and populate likedPosts
        const user = await userModel.findOne({ username: req.session.passport.user })
            .populate('likedPosts');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Format the posts with createdAt using Day.js
        const formattedLikedPosts = user.likedPosts.map(post => ({
            ...post.toObject(), // Convert to plain object
            createdAtFormatted: dayjs(post.createdAt).fromNow() // Format the createdAt date
        }));

        res.json({
            posts: formattedLikedPosts,
            username: user.username
        });
    } catch (err) {
        console.error('Error fetching liked posts:', err);
        res.status(500).json({ message: 'Error fetching liked posts' });
    }
});

// Get saved posts
app.get('/profile/saved', isLoggedIn, async (req, res) => {
    try {
        // Fetch user profile and populate savedPosts
        const user = await userModel.findById(req.user._id)
            .populate('savedPosts');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Format the posts with createdAt using Day.js
        const formattedSavedPosts = user.savedPosts.map(post => ({
            ...post.toObject(), // Convert to plain object
            createdAtFormatted: dayjs(post.createdAt).fromNow() // Format the createdAt date
        }));

        res.json({
            posts: formattedSavedPosts,
            username: user.username
        });
    } catch (err) {
        console.error('Error fetching saved posts:', err);
        res.status(500).json({ message: 'Error fetching saved posts' });
    }
});




//search handeling
app.get("/search", isLoggedIn, (req, res) => {
    res.render("search")
})

//code till here is well 
//////////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////
// Dynamic Routes
app.get("/username/:username", isLoggedIn,async (req, res) => {
    const regexp = new RegExp(`^${req.params.username}`, 'i')
    const users = await userModel.find({
        username: regexp
    })
    
    res.json(users)
})

// Like a post
app.post('/like/:postId', isLoggedIn, async (req, res) => {
    try {
        // Fetch the current logged-in user's profile
        let userProfile = await userModel.findOne({
            username: req.session.passport.user
        }).populate('posts');
        const userId = userProfile._id; // Current logged-in user's ID
        const postId = req.params.postId;

        // Find the post by ID
        let post = await postModel.findById(postId);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        // Check if the user has already liked the post
        const hasLiked = post.likes.includes(userId);

        if (hasLiked) {
            // If user has already liked the post, remove their userId (unlike)
            await postModel.findByIdAndUpdate(postId, {
                $pull: {
                    likes: userId
                } // Remove userId from post's likes array
            });

            // Remove the postId from the user's likedPosts array
            await userModel.findByIdAndUpdate(userId, {
                $pull: {
                    likedPosts: postId
                }
            });

            res.json({
                message: 'Post unliked'
            });
        } else {
            // If user has not liked the post, add their userId (like)
            await postModel.findByIdAndUpdate(postId, {
                $addToSet: {
                    likes: userId
                } // $addToSet prevents duplicates in post's likes array
            });

            // Add the postId to the user's likedPosts array
            await userModel.findByIdAndUpdate(userId, {
                $addToSet: {
                    likedPosts: postId
                }
            });

            res.json({
                message: 'Post liked'
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error liking/unliking the post'
        });
    }
});

//comments
// Route to fetch and render the comments page
app.get('/comments/:postId', (req, res) => {
    const postId = req.params.postId;
    
    // Fetch the post and comments from the database
    postModel.findById(postId)
        .populate('comments') // Assuming you have a comments schema and association
        .then(post => {
            res.render('comments', { post });
        })
        .catch(err => {
            console.error(err);
            res.redirect('/');
        });
});

// Route to follow or unfollow a user
app.post('/toggle-follow/:username', async (req, res) => {
    try {
        const currentUser = req.user; // Assuming user is available in req.user
        const targetUser = await userModel.findOne({ username: req.params.username });

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the current user is already following the target user
        const isFollowing = currentUser.following.includes(targetUser._id);

        if (isFollowing) {
            // Unfollow logic
            currentUser.following.pull(targetUser._id);
            targetUser.followers.pull(currentUser._id);
            await currentUser.save();
            await targetUser.save();
            return res.status(200).json({ message: 'User unfollowed successfully' });
        } else {
            // Follow logic
            currentUser.following.push(targetUser._id);
            targetUser.followers.push(currentUser._id);
            await currentUser.save();
            await targetUser.save();
            return res.status(200).json({ message: 'User followed successfully' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error toggling follow status', error: err });
    }
});

app.get('/profile/:username', isLoggedIn, async (req, res) => {
    try {
        // Fetch the profile user by username
        const profileUser = await userModel.findOne({ username: req.params.username })
            .populate({
                path: 'posts',
                options: { sort: { createdAt: -1 } }, // Sort posts by date (newest first)
            });

        if (!profileUser) {
            return res.status(404).send('User not found');
        }

        // Fetch the current logged-in user
        const currentUser = req.user;

        // Check if the current user is following the profile user
        const isFollowing = currentUser.following.includes(profileUser._id);

        // Format the posts' createdAt timestamps for display
        const formattedPosts = profileUser.posts.map(post => ({
            ...post.toObject(), // Convert the Mongoose object to a plain JS object
            createdAtFormatted: dayjs(post.createdAt).fromNow() // Format the date to be relative (e.g., "2 days ago")
        }));

        // Render the profile view, passing the necessary data
        res.render('viewprofile', {
            userProfile: profileUser,  // Pass profile user
            posts: formattedPosts,   // Pass formatted posts
            isFollowing  // Pass whether the current user is following the profile user
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

//viewing articles
app.get('/articleview/:id', isLoggedIn, async (req, res) => {
    try {
        const userProfile = await userModel.findOne({ username: req.session.passport.user })
            .populate('posts');
        const postId = req.params.id;

        // Fetch the post by ID
        const post = await postModel.findById(postId)
            .populate({
                path: 'userid',
                populate: {
                    path: 'posts',
                    options: { sort: { createdAt: -1 } }
                }
            });

        if (!post) {
            return res.status(404).send('Article not found');
        }

        // Determine if viewing liked, saved, or user posts
        const viewingLikedPosts = req.query.liked === 'true';  // Query param to check liked posts
        const viewingSavedPosts = req.query.saved === 'true';  // Query param to check saved posts
        let additionalPosts;

        if (viewingLikedPosts) {
            // Fetch liked posts excluding the current post
            additionalPosts = await postModel.find({
                _id: { $in: userProfile.likedPosts, $ne: postId }
            }).sort({ createdAt: -1 }).limit(10);
        } else if (viewingSavedPosts) {
            // Fetch saved posts excluding the current post
            additionalPosts = await postModel.find({
                _id: { $in: userProfile.savedPosts, $ne: postId }
            }).sort({ createdAt: -1 }).limit(10);
        } else {
            // Fetch other posts by the same user, excluding the current post
            additionalPosts = await postModel.find({
                userid: post.userid._id,
                _id: { $ne: postId }
            }).sort({ createdAt: -1 }).limit(10);
        }

        const profileUser = await postModel.findById(postId).populate('userid');
        const isFollowing = userProfile.following.includes(profileUser.userid._id);

        // Pass both the current post and additional posts to the view
        res.render('articleview-up', {
            post,
            additionalPosts,
            user: post.userid,
            userProfile,
            isFollowing,
            viewingLikedPosts,   // Send this to the frontend to know if we're viewing liked posts
            viewingSavedPosts    // Send this to the frontend to know if we're viewing saved posts
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

//deleting post
app.delete('/deletePost/:postId', async (req, res) => {
    const accessAsync = promisify(fs.access);
    const unlinkAsync = promisify(fs.unlink);

    try {
        const postId = req.params.postId;

        // Fetch the post from the database
        const post = await postModel.findById(postId);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        // Check if the filePath exists before attempting to delete the image
        if (post.filePath) {
            const filePath = path.join(__dirname, '..', 'public', post.filePath);

            try {
                await accessAsync(filePath, fs.constants.F_OK); // Check if the file exists
                await unlinkAsync(filePath); // File exists, delete it
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    console.error('Error deleting image:', err);
                    return res.status(500).json({
                        message: 'Error deleting image file'
                    });
                }
            }
        }

        // Remove the postId from the user's posts array
        await userModel.findByIdAndUpdate(post.userid, {
            $pull: {
                posts: postId
            }
        });
        // Remove the post from the postModel (delete the post)
        await postModel.findByIdAndDelete(postId);


        return res.redirect('/profile'); // Redirect back to profile after deletion

    } catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({
            message: 'Error deleting post'
        });
    }
});

// Route for saving/unsaving posts
app.post('/savePost/:postId', isLoggedIn, async (req, res) => {
    try {
        let userProfile = await userModel.findOne({
            username: req.session.passport.user
        });
        let postId = req.params.postId;

        // Find the user by ID
        const user = await userModel.findById(userProfile._id);

        if (user.savedPosts.includes(postId)) {
            // If post is already saved, unsave it
            user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
            await user.save();
            res.json({
                message: 'Post unsaved'
            });
        } else {
            // Otherwise, save the post
            user.savedPosts.push(postId);
            await user.save();
            res.json({
                message: 'Post saved'
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error saving post'
        });
    }
});

//viewing follower,followings proifle
app.get('/profile/ff/:id', async (req, res) => {
    try {
        const userId = req.params.id; 
        const profileUser = await userModel.findById(userId)
        .populate({path: 'posts',options: { sort: { createdAt: -1 } }});

    if (!profileUser) {
        return res.status(404).send('User not found');
    }
    const currentUser = req.user;

    const isFollowing = currentUser.following.includes(profileUser._id);

    const formattedPosts = profileUser.posts.map(post => ({
        ...post.toObject(), // Convert the Mongoose object to a plain JS object
        createdAtFormatted: dayjs(post.createdAt).fromNow() // Format the date to be relative (e.g., "2 days ago")
    }));

    // Render the profile view, passing the necessary data
    res.render('viewprofile', {
        userProfile: profileUser,  // Pass profile user
        posts: formattedPosts,   // Pass formatted posts
        isFollowing  // Pass whether the current user is following the profile user
    });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error'); // Handle server errors
    }
});
// Combined Route for rendering followers or following page
app.get('/profile/:id/:type', async (req, res) => {
    const { id, type } = req.params;

    try {
        // Fetch user and populate either followers or following
        const user = await userModel.findById(id).populate('followers').populate('following');
        res.render('ff-list', { userProfile: user, type });  // Pass type to render accordingly
    } catch (error) {
        res.status(500).send(`Error retrieving ${type}`);
    }
});

// Remove a follower from follower list
app.post('/profile/:id/remove-follower', async (req, res) => {
    try {
        const { followerId } = req.body;
        const user = await userModel.findById(req.params.id);
        
        // Remove the follower from the followers list
        user.followers.pull(followerId);
        await user.save();

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error removing follower' });
    }
});

// Unfollow a user from following list
app.post('/profile/:id/unfollow', async (req, res) => {
    try {
        const { followingId } = req.body;
        const user = await userModel.findById(req.params.id);
        
        // Remove the user from the following list
        user.following.pull(followingId);
        await user.save();

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error unfollowing user' });
    }
});


///////////////////////////////////////////////////////////////////////////
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/loginpage");
}

app.get('/logout', (req, res) => {
    res.redirect('/loginpage')
})

app.get("*", (req, res) => {
    res.status(404).send("Page not found");
});

app.listen(3000, (err) => {
    console.log(err)
})