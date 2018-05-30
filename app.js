var express              =require("express");
var mongoose             =require("mongoose");
var User                 =require("./models/user");
var engine              =require("ejs-mate");
var passport             =require("passport");
var ejs                  =require('ejs');
var bodyparser           =require("body-parser");
var LocalStrategy        =require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var configAuth = require('./config/auth');
mongoose.connect("mongodb://localhost/auth_social");

var app=express();
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(require("express-session")({
		secret:"whats up",
		resave:false,
		saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyparser.urlencoded({extended:true}));
app.set('view engine','ejs');
app.engine('ejs',engine);

passport.use(new LocalStrategy(User.authenticate()));
passport.use(new GoogleStrategy({

        clientID        : configAuth.googleAuth.clientID,
        clientSecret    : configAuth.googleAuth.clientSecret,
        callbackURL     : configAuth.googleAuth.callbackURL,

    },
    function(token, refreshToken, profile, done) {

        // make the code asynchronous
        // User.findOne won't fire until we have all our data back from Google
        process.nextTick(function() {

            // try to find the user based on their google id
            User.findOne({ 'google.id' : profile.id }, function(err, user) {
                if (err)
                    return done(err);

                if (user) {

                    // if a user is found, log them in
                    return done(null, user);
                } else {
                    // if the user isnt in our database, create a new user
                    var newUser          = new User();

                    // set all of the relevant information
                    newUser.google.id    = profile.id;
                    newUser.google.token = token;
                    newUser.google.name  = profile.displayName;
                    newUser.google.username = profile.emails[0].value; // pull the first email

                    // save the user
                    newUser.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, newUser);
                    });
                }
            });
        });

    }));





		passport.serializeUser(function(user, done) {
		  done(null, user);
		});

		passport.deserializeUser(function(user, done) {
		  done(null, user);
		});

//Auth Routes

app.get("/",function(req,res){
		res.render("home");
});

app.get("/register",function(req,res){//show signUp page
		res.render("register");
});
app.post("/register",function(req,res){//handling user sign up
	User.register(new User({username:req.body.username}),req.body.password,function(err,user){
			if(err)
				res.render("register");
			else
			{
			passport.authenticate("local")(req,res,function(){
			res.redirect("/profile");})
			}

})
});

app.get("/profile",isLoggedIn,function(req,res){
		res.render("profile", {
            user : req.user // get the user out of session and pass to template
        });
});
//login routes
app.get("/login",function(req,res){//render login form
		res.render("login");
});

//login logic
//middleware
app.post("/login",passport.authenticate("local",{
			successRedirect:"/profile",
			failureRedirect:"/login"
}),function(req,res){

});

app.get("/logout",function(req,res){
		req.logout();
		res.redirect("/");
});
app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

	 // the callback after google has authenticated the user
	 app.get('/auth/google/callback',
					 passport.authenticate('google', {
									 successRedirect : '/profile',
									 failureRedirect : '/'
					 }));

function isLoggedIn(req,res,next){
		if(req.isAuthenticated()){
			return next();
		}
	res.redirect("/login");
}

app.listen(8080,function(){
		console.log("server is running");
});
