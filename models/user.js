var mongoose=require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");
var UserSchema = new mongoose.Schema({
	local            : {
		 username        : String,
		 password     : String,
 },
 google           : {
        id           : String,
        token        : String,
        username        : String,
        name         : String
    }
});

UserSchema.plugin(passportLocalMongoose);
module.exports=mongoose.model("User",UserSchema);
