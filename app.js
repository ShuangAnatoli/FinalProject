const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const underscore = require ("underscore");
const mongooseEncryption = require("mongoose-encryption");
const _= require ("lodash");
const { Schema } = mongoose;
const session = require('express-session');
const passport = require("passport");
const flash = require('connect-flash');
const passportLocalMongoose = require("passport-local-mongoose");
const { deserializeUser } = require("passport/lib");


// Date function

function dateFormat (date, fstr, utc) {
  utc = utc ? 'getUTC' : 'get';
  return fstr.replace (/%[YmdHMS]/g, function (m) {
    switch (m) {
    case '%Y': return date[utc + 'FullYear'] (); // no leading zeros required
    case '%m': m = 1 + date[utc + 'Month'] (); break;
    case '%d': m = date[utc + 'Date'] (); break;
    case '%H': m = date[utc + 'Hours'] (); break;
    case '%M': m = date[utc + 'Minutes'] (); break;
    case '%S': m = date[utc + 'Seconds'] (); break;
    default: return m.slice (1); // unknown code, remove %
    }
    // add leading zero if required
    return ('0' + m).slice (-2);
  });
}

const app = express();

//GLOBAL
var tzoffset = (new Date()).getTimezoneOffset() * 60000;
const date = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
const yesterday = dateFormat (new Date(new Date().getTime() - 24*60*60*1000), "%Y-%m-%d", false);

//USE

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "thisnumberfourandfiveofthegroup.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// DATABASE CONNECTION

mongoose.connect("mongodb://localhost:27017/mhaDB", {useNewUrlParser: true});


// SCHEMAS
//need to umm validate
const userSchema = new mongoose.Schema ({
  username: String,
  password: String,
  role: String
}
);

userSchema.plugin(passportLocalMongoose); 

const userdetailSchema = new mongoose.Schema ({
  user: {type: Schema.Types.ObjectId, ref:'User'},
  email: {type: Schema.Types.String, ref:'User'},
  displayname: String,
  age: Number,
  gender: String,
  habitItem: Number,
  sobrietyItem: Number,
  JournalItem: Number, 
  achievements:[
    {
      name:String,
      clearConditions: String,
      tag: String
    }
  ]
});

const defaultItemsSchema = new mongoose.Schema ({
  name: String,
  type: String
});

const journalSchema = new mongoose.Schema({
  user: {type: Schema.Types.ObjectId, ref:'User'},
  content : String,
  reflection : String,
  mood : Number,
  entryDate : String
},{timestamp:true});

const habitSchema = new mongoose.Schema({
  user: {type: Schema.Types.ObjectId, ref:'User'},
  habitName: String,
  reason: String,
  progress: Number,
  start : String
},{timestamp:true});

// habits: [{name: String, progress: Number}]

const habitTrackerSchema = new mongoose.Schema({
  user: {type: Schema.Types.ObjectId, ref:'User'},
  habit: {type: Schema.Types.ObjectId, ref:'Habit'},
  name:  {type: Schema.Types.String, ref:'Habit'},
  // reason: {type: Schema.Types.String, ref:'Habit'},
  checkin : [{
    check : Boolean,
    date : { type: String, required: true, unique: true }
  }],
  progress: Number
},{timestamp:true});

const sobrietyTrackSchema = new mongoose.Schema({
  user: {type: Schema.Types.ObjectId, ref:'User'},
  name: String,
  reason: String,
  startDate: String
},{timestamp:true});

const sobrietyCheckSchema = new mongoose.Schema({
  user: {type: Schema.Types.ObjectId, ref:'User'},
  soberID: {type: Schema.Types.ObjectId, ref:'SobrietyTrack'},
  soberName : {type: Schema.Types.String, ref:'SobrietyTrack'},
  start: String,
  checkin : [{
    check : Boolean,
    date : { type: String, required: true, unique: true }
  }],
  progress: Number
},{timestamp:true});

const achievementSchema = new mongoose.Schema({
  name: String,
  category: String,
  conditions: String,
  points: Number
},{timestamp:true});


const categorySchema = new mongoose.Schema({
  name: String
});

const postSchema = new mongoose.Schema({
  user:{type: Schema.Types.ObjectId, ref:'User'},
  userDisplay:{type: Schema.Types.String, ref:'UserDetail'},
  title: String,
  category: String,
  content: String,
  postDate: String,
  comments: [{
    cmtUser: {type: Schema.Types.ObjectId, ref:'UserDetail'},
    cmtUserName: {type: Schema.Types.String, ref:'UserDetail'},
    comment: String,
    cmtDate: String
  }],
  report:[{
    user:{type: Schema.Types.ObjectId, ref:'UserDetail'},
    repContent: String
  }]
},{timestamp:true});

//MODELS

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy(),{usernameField: 'email'});

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const UserDetail = new mongoose.model("UserDetail", userdetailSchema);

const DefaultItem = new mongoose.model("DefaultItem", defaultItemsSchema);

const Journal = new mongoose.model("Journal", journalSchema);



const Habit = new mongoose.model("Habit", habitSchema);

const HabitTracker = new mongoose.model("HabitTracker", habitTrackerSchema);

const SobrietyTrack = new mongoose.model("SobrietyTrack", sobrietyTrackSchema);

const SobrietyCheck = new mongoose.model("SobrietyCheck", sobrietyCheckSchema);

const Achievement = new mongoose.model("Achievement", achievementSchema);

const Category = new mongoose.model("Category", categorySchema);

const Post = new mongoose.model("Post", postSchema);

//FUNCTIONS
function addAchievements(x,y){

  HabitTracker.find({user:x, habit:y});
  return habitProgress;
}

// GET
app.get("/adminReg", function(req, res){
  res.render("adminReg");
});

app.get("/manageCategory", function(req, res){
  if (req.isAuthenticated() && req.user.role=="admin"){
    Category.find({}, function(err, items){
      if(err){
        console.log(err);
      }else{
        res.render("manageCategory", {items:items});
      }
    });
  }else{
    res.redirect("/login");
  }
});

app.post("/addCategory", function(req, res){
  const name= req.body.name;
  const newCat = new Category({
    name: name

  });
  newCat.save(function(err){
    if(err){
      console.log(err);
    }
  });
  res.redirect("/manageCategory");
});

app.get("/deleteCategory/:id", function(req, res){
  if(req.isAuthenticated() && req.user.role=="admin"){
    let id = req.params.id;

  Category.remove({ _id: id }, function(err) {
    if (!err) {
      console.log("Success");
      res.redirect("/manageCategory");
    }
    else {
      console.log(err);
    }
  });
  }else{
    res.redirect("/login");
  }
});

app.get("/manageDefaultItems", function(req, res){
  if(req.isAuthenticated() && req.user.role=="admin"){
    DefaultItem.find({}, function(err, items){
      if(err){
        console.log(err);
      }else{
        res.render("manageDefaultItems", {items:items});
      }
    });
  }else{
    res.redirect("/login");
  }
});

app.get("/deleteDefaultItem/:id", function(req, res){
  if(req.isAuthenticated() && req.user.role=="admin"){
    let id = req.params.id;
    DefaultItem.remove({ _id: id }, function(err) {
    if (!err) {
      console.log("Success");
      res.redirect("/manageDefaultItems");
    }
    else {
      console.log(err);
    }
  });
  }else{
    res.redirect("/login");
  }
});


app.post("/addDefaultItem", function(req, res){
  const name= req.body.name;
  const type= req.body.type;

  const newItem = new DefaultItem({
    name: name,
    type: type
  });
  newItem.save(function(err){
    if(err){
      console.log(err);
    }
  });
  res.redirect("/manageDefaultItems");
});

app.get("/userManagement", function(req, res){
  if(req.isAuthenticated() && req.user.role=="admin"){
    User.find({}, function(err, allUsers){
      if(!allUsers){
        console.log(err);
      }else{
        // console.log(allUsers);
        res.render("userManagement", {users: allUsers});
      }
    });
  }else{
    res.redirect("/login");
  }
});

app.get("/deleteUser", function(req, res){
  if(req.isAuthenticated() && req.user.role=="admin"){
    let id= req.query.id;
    User.findByIdAndDelete({_id:id}, function(err, users){
      if(err){
        console.log(err);
      }else{
        console.log("Deleted : ", users);
  
  // Delete userdetails
  
        UserDetail.findOneAndDelete({user:id}, function(err, userDetails){
          if(err){
            console.log(err);
          }else{
            console.log("Deleted : ", userDetails);
          }
        });
  
  // Delete journals
  
        Journal.findOneAndDelete({user: id}, function(err, journals){
          if(err){
            console.log(err);
          }else{
            console.log("Deleted : ", journals);
          }
        });
  
  // Delete habits
  
        Habit.findOneAndDelete({user: id}, function(err, habits){
          if(err){
            console.log(err);
          }else{
            console.log("Deleted : ", habits);
            
          }
        });
  
  // Delete habit tracker
  
        HabitTracker.findOneAndDelete({user: id}, function(err, habittrackers){
          if(err){
            console.log(err);
          }else{
            console.log("Deleted : ", habittrackers);
          }
        });
  
  // Delete sobriety check
  
        SobrietyCheck.findOneAndDelete({user: id}, function(err, sobrietychecks){
          if(err){
            console.log(err);
          }else{
            console.log("Deleted : ", sobrietychecks);
            
          }
        });
  
  // Delete sobriety track
    
        SobrietyTrack.findOneAndDelete({user: id}, function(err, sobrietytracks){
          if(err){
            console.log(err);
          }else{
            console.log("Deleted : ", sobrietytracks);
            
          }
        });
  
  // Delete post
  
        Post.findOneAndDelete({user: id}, function(err, posts){
          if(err){
            console.log(err);
          }else{
            console.log("Deleted : ", posts);
          }
        });
        
        res.redirect('/usermanagement');
      }
    });
  }else{
    res.redirect("/login");
  }
});

//rendering the achievement management page

app.get("/achievementManagement", function(req, res){

  if(req.isAuthenticated() && req.user.role=="admin"){
    res.render("achievementManagement");
  }else{
    res.redirect("/login");
  }
  
 
});

//Adding default achievements

app.post("/addAchievements", function(req, res){
  const category = req.body.category;
  const name = req.body.name;
  const conditions = req.body.conditions;
  const points = req.body.points;

  const newAchievemnets = new Achievement({
    name: name,
    category: category,
    conditions: conditions,
    points: points
  });
  newAchievemnets.save(function(err){
    if(err){
      console.log(err);
    }else{
      res.redirect('/viewAchievements');
    }
  });
});

  // if(category==="habit"){
  //  );

  // }else if(category==="sobriety"){

  //   const sAchievement = new SobrietyAchievement({
  //     name: name,
  //     conditions: conditions,
  //     points: points
  //   });
  //   sAchievement.save(function(err){
  //     if(err){
  //       console.log(err);
  //     }
  //   });

  // }else if(category==="journal"){
  //   const jAchievement = new JournalAchievement({
  //     name: name,
  //     conditions: conditions,
  //     points: points
  //   });
  //   jAchievement.save(function(err){
  //     if(err){
  //       console.log(err);
  //     }
  //   });
  // }
 


// Viewing and managing all achievements

// app.get('/viewAchievements', async(req, res) => {
//   let list = [];
//   list.result = await db.collection('habitAchievements').find().toArray();
//     list.result2 = await db.collection('sobrietyAchievements').find().toArray();
//     list.result3 = await db.collection('journalAchievements').find().toArray();
//   res.render("viewAchievements", list);
// });

app.get("/viewAchievements", function(req,res){
  if(req.isAuthenticated() && req.user.role=="admin"){
    Achievement.find({}, function(err,results){
      // console.log(results);
     
      Achievement.find({category:"Journal"}, )
      res.render("viewAchievements", {achievements:results});
  });
  }else{
    res.redirect("/login");
  }
});

app.get("/deleteAchievements/:id", function(req,res){
  if(req.isAuthenticated() && req.user.role=="admin"){
    let id= req.params.id;
  Achievement.remove({ _id: id }, function(err) {
    if (!err) {
      console.log("Success");
      res.redirect("/viewAchievements");
    }
    else {
      console.log(err);
    }
  });
  }else{
    res.redirect("/login");
  }
});


//show all posts in the community

app.get("/viewPosts", async function(req, res){
  if(req.isAuthenticated()){
    let role=req.user.role;
    findPosts =  function () { 
      return Post.find({}); 
    }
    findCat =  function () { 
      return Category.find({}); 
    }
  
    const array = [findPosts(),findCat()];
    const promise = await Promise.all(array);
    res.render("viewPosts", {items: promise, role});
    // res.json(promise);
  
    // Post.find({}, function(err, posts){
    //   if(!posts){
    //     console.log("No post found.");
    //   }else{
    //     Category.find({});
    //     res.render("viewPosts", {posts: posts});
    //   }
    // });
  }else{
    res.redirect("/login");
  } 
});

app.get("/categorisedPosts/:category", async function(req, res){
  if(req.isAuthenticated()){
    let role= req.user.role;
    let category = req.params.category;
    findPosts =  function () { 
      return Post.find({category: category}); 
    }
    findCat =  function () { 
      return Category.find({}); 
    }
  
    const array = [findPosts(),findCat()];
    const promise = await Promise.all(array);
    res.render("viewPosts", {items: promise, role});
    // res.json(promise);
  
    // Post.find({}, function(err, posts){
    //   if(!posts){
    //     console.log("No post found.");
    //   }else{
    //     Category.find({});
    //     res.render("viewPosts", {posts: posts});
    //   }
    // });
  }else{
    res.redirect("/login");
  } 
});

//Posting a post

app.post("/addPosts", function(req, res){
  const userId= req.user._id;
  // const displayName=UserDetail.findOne({user:userId}, function(err, details){
  //   if(err){
  //     console.log(err);
  //   }
  // });
  var result= req.user.username;
 
 
  const title= req.body.title;
  const content= req.body.content;
  const category = req.body.category;
  const postDate = dateFormat (new Date (), "%Y-%m-%d %H:%M:%S", false);
  const newPost = new Post({
    user: userId,
    userDisplay: result.slice(0,-10),
    title: title,
    category: category,
    content: content,
    postDate: postDate
  });
  newPost.save(function(err){
    if(err){
      console.log(err);
    }
  });
  res.redirect("/viewPosts");
});

//Viewing single post

app.get("/postSingle", function(req, res){
  let id=req.query.id;
  Post.findById({_id:id}, function(err, post){
    if(err){
      console.log(err);
    }else{
      const userId = req.user._id;
      res.render("postSingle", {post: post, user: userId});
    }
  });
});


//posting a comment

app.post("/addComment", function(req, res){
  //cmtUserName: result.displayname
  let postId = req.body.postId;
  let userId= req.user._id;
  let username = req.user.username.slice(0,-10);
  
  const comment = req.body.comment;
  const date = dateFormat (new Date (), "%Y-%m-%d %H:%M:%S", false);
  console.log(comment);
  var conditions={_id:postId},
    addone={cmtUser:userId, cmtUserName:username, comment:comment, cmtDate: date},
    update={$push:{"comments":addone}},
    options={multi:true}

  Post.findOneAndUpdate(conditions,update,options, callback); 

  function callback(err){
    if(err){
      console.log(err);
    }
  }
  res.redirect("/postSingle/?id="+ postId);
  
});

app.post("/addReport", function(req, res){
  //cmtUserName: result.displayname
  let postId = req.body.postId;
  let userId= req.user._id;

  var conditions={_id:postId},
    addone={user:userId, repContent: req.body.report},
    update={$push:{"report":addone}},
    options={multi:true}

  Post.findOneAndUpdate(conditions,update,options, callback); 

  function callback(err){
    if(err){
      console.log(err);
    }
  }
  res.redirect("/postSingle/?id="+ postId);
  
});



//Managing comments (view and delete)

app.get("/userComments", function(req,res){
  if (req.isAuthenticated()){
    let role = req.user.role;
    try {

       Post.find({cmtUser:req.user._id}, function(err, posts){
        if(err){
          console.log(err);
        }else{
          const success = req.flash('success');
          console.log(posts);
          res.render("userComments", {posts: posts, success, role});
        }
      });
    } catch (error) {
      console.log(error);
    }
  }else{
    res.redirect("/login");
  }
});

app.get("/deleteComment/:id", function(req,res){
  if (req.isAuthenticated()){
    try {
      let cmtId = req.params.id;
      Post.findOneAndUpdate({cmtUser: req.user._id}, { $pull: { comments: {_id:cmtId} } }, function(err, comment) {
        if (!err) {
          // req.flash('success', 'Comment deleted successfully.');
          res.redirect("/userComments");
         }else{
           console.log(err);
         }
      });
    } catch (error) {
      console.log(error);
    }
  }else{
    res.redirect("/login");
  }
});



//Test calendar

app.get("/calendar", function(req, res){
  res.render("calendar");
});

app.get("/register", function(req, res){
  res.render("register");
 });

app.get("/login", function(req, res){
  res.render("login");
}); 

app.get("/logout", function(req,res){
  req.logout();
  res.redirect("login");
}); 

app.get("/managePosts", function(req,res){
  if(req.isAuthenticated() && req.user.role=="admin"){
    Post.find({}, function(err, posts){
      if(err){
        console.log(err);
      }else{
        res.render("managePosts", {posts});
      }
    });
  }else{

  }
});

app.get("/deletePost", function(req,res){
  if(req.isAuthenticated() && req.user.role=="admin"){
    let id= req.query.id;
    Post.remove({ _id: id }, function(err) {
      if (!err) {
        console.log("Success");
        req.flash(
        'success_msg',
        'Deleted Successfully.');
        res.redirect("/managePosts");
      }
      else {
        console.log(err);
      }
  });
  }else{
    res.redirect("/login");
  } 
});

app.get("/dashboard", async function(req, res){
  if (req.isAuthenticated() && req.user.role=="user"){
      const role= req.user.role;
      Journal.find({user:req.user._id}, function(err, data){
        var moods = [];
            var dates = [];
            data.forEach(function(item){
              moods.push(item.mood);
              let entryD = item.entryDate.slice(0,10);
              dates.push(entryD);
            });
            console.log(moods);
            console.log(dates);
            var recentM = moods.slice(-7);
            var recentD = dates.slice(-7);
            var total = moods.length;

            res.render("dashboard", {moods:recentM, dates:recentD, total, role});
      });
    }else if(req.isAuthenticated() && req.user.role=="admin"){
      const role= req.user.role;
      findDefaults =  function () { 
        return DefaultItem.count(); 
      }
      findCat =  function () { 
        return Category.count(); 
      }

      findAchi =  function () { 
        return Achievement.count(); 
      }

      findUsers =  function () { 
        return User.count(); 
      }
      
      findPosts =  function () { 
        return Post.count(); 
      }
      const array = [findDefaults(),findCat(), findAchi(), findUsers(), findPosts()];
      const promise = await Promise.all(array);
      console.log(promise);
      const numDI = promise[0];
      const numCat = promise[1];
      const numAchi = promise[2];
      const numUsers = promise[3];
      const numPosts = promise[4];
      console.log(numDI);
      res.render("dashboard", {
        items: promise,
         role, numDI, numCat, numAchi, numUsers, numPosts});
    }else{
      res.redirect("/login");
    }
 });

app.get("/details", function(req, res){
  if (req.isAuthenticated()){
    try {
       UserDetail.findOne({user:req.user._id}, function(err, user){
        if(err){
          console.log(err);
        }else{
          console.log(user);
          res.render("details", {details: user});
        }
      });
    } catch (error) {
      console.log(error);
    }
   
  }else{
    res.redirect("/login");
  }
 });

 app.get("/userAccount", function(req, res){
  if (req.isAuthenticated()){
    let role= req.user.role;
    var id= req.user._id;
    console.log(id);
    User.findById(id,function(err, foundUser){
      if (!foundUser){
        console.log(err);
      }else{
    
        UserDetail.findOne({user: req.user._id},function(err, foundDetail){
          if (!foundDetail){
            console.log("User detail not set.");
          }else{
            
            res.render("userAccount", {entry:foundUser, message:foundDetail,role});
          } 
        });
      }
    });
  }else{
    res.redirect("/login");
  }
 });

 app.get("/userPosts", function(req,res){
   if(req.isAuthenticated()){
     let role = req.user.role;
    Post.find({user:req.user._id}, function(err, posts){
      res.render("userPosts", {posts:posts, role});
    });
  
   }
    
  
 });

 app.get("/deletePost/:id", function(req,res){
  let id= req.params.id;
  Post.remove({ _id: id }, function(err) {
    if (!err) {
      console.log("Success");
      res.redirect("/userPosts");
    }
    else {
      console.log(err);
    }
});
 });

 app.get("/update-userhAchievement", function(req, res){
   if(req.isAuthenticated()){
    let id=req.query.id;
    Achievement.findOne({_id:id}, function(err, achievement){
      if(!achievement){
        console.log(err);
      }else{
        var conditions={user:req.user._id},
        addone={name:achievement.name,clearConditions:achievement.conditions,tag:"Habit"},
        update={$push:{"achievements":addone}},
        options={upsert:true}

        UserDetail.findOneAndUpdate(conditions,update,options,callback);

        function callback(err){
          if(err){
            console.log(err);
          }else{
            res.redirect("/achievements");
          }
        }
      }
    });
    console.log(id);
   }else{
     res.redirect("/login");
   }
 });

 app.get("/achievements", function(req,res){
  if(req.isAuthenticated()){
    let id=req.user._id;
    UserDetail.findOne({user:id}, function(err, detail){
      if(!detail){
        console.log(err);
      }else{
        res.render("achievements", {achievements: detail.achievements});
      }
    });
    // console.log(id);
   }else{
     res.redirect("/login");
   }
 });
   
app.get("/journal", function(req, res){
  if (req.isAuthenticated() && req.user.role=="user"){
    res.render("journal", {
      date : date
    });
  }else{
    res.redirect("/login");
  }
}); 

app.get("/viewJournal", function(req, res){
  if(req.isAuthenticated()){
    Journal.find({user: req.user._id}, function(err, foundJournals){
        if (foundJournals.length===0){
          console.log(err);
        }else{
          res.render("viewJournal",{
            entries: foundJournals
          });
        }
      });
  }else{
    res.redirect("/login");
  }
});


app.get("/singleJournal/:journalId", function(req, res){
  if(req.isAuthenticated()){
    const requestedJournalId = req.params.journalId;

    Journal.findOne({_id:requestedJournalId},function(err, entry){
      res.render("singleJournal",{
        entryDate: entry.entryDate,
        content: entry.content,
        reflection: entry.reflection,
        mood: entry.mood
      });
    });
  }else{
    res.redirect("/login");
  }
});

app.get("/activity", async function(req, res){
  if (req.isAuthenticated()){
    findDefaults =  function () { 
      return DefaultItem.find({type:'habit'}); 
    }
    findExisting =  function () { 
      return Habit.find({user: req.user._id}); 
    }
    const array = [findDefaults(),findExisting()];
    const promise = await Promise.all(array);
    res.render("activity", {items: promise});
  }else{
    res.redirect("/login");
  }
}); 

app.get("/deletehabit", function(req, res){
  if (req.isAuthenticated()){
    let id= req.query.id;
    Habit.remove({ _id: id }, function(err) {
      if (!err) {
        console.log("Success");
        HabitTracker.remove({habit: id }, function(err) {
          if (!err) {
            console.log("Success");
          }
          else {
            console.log(err);
          }
        });
        res.redirect("/activity");
      }
      else {
        console.log(err);
      }
    });
  }else{
    res.redirect("/login");
  }
});

app.get("/deleteSD", function(req, res){
  if (req.isAuthenticated()){
    let id= req.query.id;
    SobrietyTrack.remove({_id:id }, function(err) {
      if (!err) {
        console.log("Success");
        SobrietyCheck.remove({soberID: id }, function(err) {
          if (!err) {
            console.log("Success");
          }
          else {
            console.log(err);
          }
        });
        res.redirect("/soberDetails");
      }
      else {
        console.log(err);
      }
    });
  }else{
    res.redirect("/login");
  }
});

app.get("/habitDaily", function(req, res){
  if (req.isAuthenticated()){

    Habit.find({user: req.user._id}, function(err, foundHabits){
      if (foundHabits===0){
        console.log("No habits added.");
      }else{
        res.render("habitDaily", {Date: date, newHabits: foundHabits});
      }
    });
    
  }else{
    res.redirect("/login");
  }
}); 

app.get("/habitSingle/:habitId", function(req, res){
  if (req.isAuthenticated()){
    const id = req.params.habitId;
    var days= [];
    
    HabitTracker.findOne({habit:id},function(err, habit){
      res.render("habitSingle",{
       habit: habit,
       date: date,
       days
      });
    });
  }else{
    res.redirect("/login");
  }
}); 
function getD(n) {
  let d = new Date();
  d.setDate(d.getDate() + n);
  var newDate = d.toLocaleDateString('pt-br').split( '/' ).reverse( ).join( '-' );
  var day;
  switch (d.getDay()) {
      case 0: day = 'Sun';
          break;
      case 1: day = 'Mon';
          break;
      case 2: day = 'Tue';
          break;
      case 3: day = 'Wed';
          break;
      case 4: day = 'Thu';
          break;
      case 5: day = 'Fri';
          break;
      case 6: day = 'Sat';
          break;
  }
  return { date: newDate, day };
}
app.get("/checked", function (req,res){
  if (req.isAuthenticated() && req.user.role=="user"){
    let id=req.query.id;
    const today = dateFormat (new Date (), "%Y-%m-%d", false);
    const hour = dateFormat (new Date (), "%H:%M:%S", false);
    const query={
      // $inc : { "progress" : 1 },
      $push: {"checkin" : {"check" : true, "date" : today}}
    }
    const add={
      $inc : { "habitItem" : 1 },
    }
    var options={multi:true};

    HabitTracker.findOneAndUpdate({habit:id}, query, options, function(err, result){
      if(!result){
        console.log(err);
      }else{
        console.log(result);
        res.redirect('/habitSingle/'+ id);
      }
    });

    UserDetail.findOneAndUpdate({user:req.user._id}, add, options, function(err, result){
      if(!result){
        console.log(err);
      }else{
        console.log(result);
      }
    });
  }else{
    res.redirect("/login");
  }
});

app.get("/habitHistory", function(req,res){
  if (req.isAuthenticated()){
    HabitTracker.find({user: req.user._id}, function(err, foundStuffs){
      if(foundStuffs===0){
        console.log(err);
      }
      else{
        console.log(foundStuffs);
        res.render("habitHistory", {Date : date, habitHistories : foundStuffs});
      }
    });
  }else{
    res.redirect("/login");
  }
});

app.get("/habitAchievements", function(req, res){
  if (req.isAuthenticated() && req.user.role=="user"){
    Achievement.find({category:"habit"}, function(err, foundAchievements){
      if (foundAchievements===0){
        console.log(err+"No achievements found.");
      }else{
        UserDetail.findOne({user: req.user._id}, function(err, user){
          res.render("habitAchievements", {achievements: foundAchievements, user: user});
        });
      }
    });
  }else{
    res.redirect("/login");
  }
});

app.get("/sobrietyAchievements", function(req, res){
  if (req.isAuthenticated() && req.user.role=="user"){
    Achievement.find({category:"sobriety"}, function(err, foundAchievements){
      if (foundAchievements===0){
        console.log(err+"No achievements found.");
      }else{
        UserDetail.findOne({user: req.user._id}, function(err, user){
          res.render("sobrietyAchievements", {achievements: foundAchievements, user: user});
        });
      }
    });
  }else{
    res.redirect("/login");
  }
});

app.get("/journalAchievement", function(req, res){
  if (req.isAuthenticated() && req.user.role=="user"){
    Achievement.find({category:"journal"}, function(err, foundAchievements){
      if (foundAchievements===0){
        console.log(err+"No achievements found.");
      }else{
        
        UserDetail.findOne({user: req.user._id}, function(err, user){
          res.render("journalAchievement", {achievements: foundAchievements, user: user});
        });
      }
    });
  }else{
    res.redirect("/login");
  }
});



app.get("/soberDetails", async function(req,res){
  if (req.isAuthenticated()){
    findSoberDetails =  function () { 
      return SobrietyTrack.find({user:req.user._id}); 
    }
    findDefaults =  function () { 
      return DefaultItem.find({type:'sobriety'}); 
    }
    const array = [findSoberDetails(),findDefaults()];
    const promise = await Promise.all(array);
    res.render("soberDetails", {items: promise});
  }else{
    res.redirect("/login");
  }
});

app.get("/soberProgress", function(req,res){
  if (req.isAuthenticated() && req.user.role=="user"){
    SobrietyCheck.find({user: req.user._id}, function(err, foundStuffs){
      if(foundStuffs===0){
        console.log(err);
      }
      else{
        console.log(foundStuffs);
        res.render("soberProgress", {Date : date, newSobrietyStuffs : foundStuffs});
      }
    });
  }else{
    res.redirect("/login");
  }
});

app.get("/sobrietyHistory/:id", function(req,res){
  if (req.isAuthenticated()){
    let id=req.params.id;
    console.log(id);
    SobrietyCheck.findOne({_id:id}, function(err, foundStuff){ 
     
      res.render("sobrietyHistory",
      {Date : date, 
      sobrietyHistories : foundStuff
      }
      );   
    });
  }else{
    res.redirect("/login");
  }
});

app.get("/", function(req,res){
  console.log("Hi");
});


// POST

app.post("/register", async (req,res) => {
  const newUser = new User({
    username: req.body.username,
    password: req.body.password,
    role: req.body.role
  });
  await User.register(newUser, req.body.password, function(err, user){
    if (err){
      console.log(err);
      return res.redirect("/register");
    }else{
      console.log(user.role);
        passport.authenticate("local")(req, res, function(){
          const newUserDetail = new UserDetail({
            user: newUser._id,
            email: newUser.username,
            displayname: newUser.username.slice(0,-10),
            age: 0,
            gender: "Not set",
            habitItem: 0,
            sobrietyItem: 0,
            JournalItem: 0, 
            achievements:[]
          });
          newUserDetail.save(function(err){
            if(err){
               console.log(err);
            }
            else{
              res.redirect("/dashboard"); //+ req.user._id
             }
          });
      });
    }
  });
});

app.post("/detailsUpdate", async (req,res)=>{
  var dName= req.body.dName;
  var age=req.body.age;
  var gender=req.body.gender;
  var query={
    $set:{
      "displayname":dName,
      "age":age,
      "gender":gender
    }
  }
  UserDetail.findOneAndUpdate({user:req.user._id}, query, {multi:true}, function(err,response){
    if(err){
      res.send(err);
    }else{
      res.redirect("/userAccount");
      console.log("Updated Successfully");
    }
  });

})

app.post("/login", function(req,res){
  const user = new User({
    username : req.body.email,
    password : req.body.password
   
  });
  req.login(user, function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req, res, function(){
       
        res.redirect("/dashboard"); 
      });
    }
  });
});

app.post("/journal", function(req,res){
  
  const userId = req.user._id;
  const entry = req.body.entry;
  const reflection = req.body.reflection;
  const mood = req.body.mood;
  const date = dateFormat (new Date (), "%Y-%m-%d", false);
  const hour = dateFormat (new Date (), "%H:%M:%S", false);
  console.log(hour);
  Journal.find({$and:[{user:userId},{entryDate: date}]}, function(err, journals){
    if(journals.length!=0){
      console.log(journals);
      res.redirect("/viewJournal");  
    }else{
      const newJournal = new Journal({
        user: userId,
        content : entry,
        reflection : reflection,
        mood : mood,
        entryDate : date
      });
      newJournal.save(function(err){
        if(err){
           console.log(err);
         }
        else{
          
          const add={
            $inc : { "JournalItem" : 1 },
          }
          var options={multi:true};
      
          UserDetail.findOneAndUpdate({user:req.user._id}, add, options, function(err, result){
            if(!result){
              console.log(err);
            }else{
              console.log(result);
            }
          });
           res.redirect("/viewJournal");
          }
       });
    }
  });
});

app.post("/activity", function(req,res){
  const userID = req.user._id;
  const habitName = req.body.newHabit;
  const reason = req.body.reason;
  var tzoffset = (new Date()).getTimezoneOffset() * 60000;
  const startDate = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
  
  const habit = new Habit({
    user: userID,
    habitName: habitName,
    reason: reason,
    start : startDate
  });
  habit.save(function(err){
    if (err){
      console.log(err);
    }else{
      res.redirect("/activity");
      
      const habitId = habit._id;
      const name = habit.habitName;
  
      const habitTracker = new HabitTracker({
        user: userID,
        habit: habitId,
        name : name,
        checkin : [{
          check : 0,
          date : yesterday
        }]
      });
      
      habitTracker.save(function(err){
        if (err){
          console.log(err);
        }
      });
    }
  });
});


app.post("/soberDetails", function(req,res){
  const userID = req.user._id;
  const soberName = req.body.soberName;
  const reason = req.body.reason;

  var tzoffset = (new Date()).getTimezoneOffset() * 60000;
  const startDate = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);

  const newSobriety = new SobrietyTrack({
    user: userID,
    name: soberName,
    reason: reason,
    startDate: startDate
  });

  newSobriety.save(function(err){
    if (err){
      console.log(err);
    }else{
      const soberDate = newSobriety.startDate;
      const soberName = newSobriety.name;
      const soberID = newSobriety._id;
      const start = newSobriety.startDate;

      const newSobrietyCheck = new SobrietyCheck({
        user: userID,
        soberID: soberID,
        soberName : soberName,
        start: start,
        checkin : [{
          check : 0,
          date : yesterday
        }],
       
      });
      newSobrietyCheck.save(function(err){
        if (err){
          console.log(err);
        }else{
          res.redirect("/soberDetails");
        }
      });
    }
  });
});

app.post("/checkSober", function(req,res){
  let id = req.query.id;
  const checked = req.body.sobrietyCheck;
  const sobrietyName = req.body.sobrietyName;
  var tzoffset = (new Date()).getTimezoneOffset() * 60000;
  const today = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);

  var conditions = {soberID: checked}
  , dailyCheck = { check: 1, date: today}
  , update =  { $inc : { "progress" : 1 }, $push: { "checkin": dailyCheck }}
  , options = { multi: true };
  SobrietyCheck.findOneAndUpdate (conditions, update, options, callback);

  function callback(err){
    if(err){
      console.log(err);
    }else{
      res.redirect("/soberProgress");
    }
  }
});

app.get("/checkSober", function(req,res){
  if(req.isAuthenticated() && req.user.role=="user"){
    let id=req.query.id;
    const today = dateFormat (new Date (), "%Y-%m-%d", false);
    const hour = dateFormat (new Date (), "%H:%M:%S", false);
    const query={
      $push: {"checkin" : {"check" : true, "date" : today}}
    }
    const add={
      $inc : { "sobrietyItem" : 1 },
    }
    var options={multi:true};

    SobrietyCheck.findOneAndUpdate({_id:id}, query, options, function(err, result){
      if(!result){
        console.log(err);
      }else{
        console.log(result);
        res.redirect('/sobrietyHistory/'+ id);
      }
    });

    UserDetail.findOneAndUpdate({user:req.user._id}, add, options, function(err, result){
      if(!result){
        console.log(err);
      }else{
        console.log(result);
      }
    });
  }else{
    res.redirect("/login");
  }
  
});

app.listen(3000, function(req,res){
  console.log("Server has started on port 3000.");
});
