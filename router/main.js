
var passport = require('passport');
var passwordValidator = require('password-validator');
var transporter = require('./sendmail')();
var Hogan = require("hogan.js");
var async = require("async");
var fs = require("fs")
var http = require('http');
var FormData = require('form-data');

const Mydb = require('./config/mydb')

function ensureAuthenticated(req, res, next) {
    // 로그인이 되어 있으면, 다음 파이프라인으로 진행
    if (req.isAuthenticated()) { return next(); }
    // 로그인이 안되어 있으면, login 페이지로 진행
    res.redirect('/login');
}

function sendEmail(to,randomKey,callback) {

  async.waterfall(
      [
          function (callback) {
            //console.log(process.cwd())
            var emailTemplate = process.cwd()+"/mail/initPassTemplete.html";
            fs.readFile(emailTemplate, "utf8", function (err, templateData) {
              if(err) console.log(err)
              console.log("mail callback1");
              callback(null,templateData);
            });
          },
          function (templateData, callback) {
              var template,
		template = Hogan.compile(templateData);
              html = template.render({key: randomKey});
              console.log("mail callback2");
              var subject = 'OTCUBE COIN temp password';


              let form = new FormData()


              form.append('email', to)
              form.append('title', subject)
              form.append('contents', html)
              form.append('flag', '') 
              form.append('send_email', '')
              form.append('ip', '')
              form.submit('', function(err, res) {
              // res – response object (http.IncomingMessage)  //
              if(err) callback(err);
              //res.resume();
              callback(null,{result:true})
            });
          }
      ], function (err, result) {
          if(err) callback(err);
          else callback(null, result);
    });
}

function fnGetShortURL(short, callback) {
  var user = require("./userDB");
  var myUser = user('','',short,'');
  myUser.getShortURL(function(err,obj) {
    if(err) {
      console.log(err)
      return callback(null,{'result':false});
    } else {
      if(obj.result == false) {
        return callback(null,{'result':false});
      } else {
        return callback(null,obj);
      }
    }
  })
} //fnGetShortURL

var recommURL = "";
module.exports = function(app, pool)
{

    app.get('/',function(req,res){
        res.redirect('/login');
    });

     app.get('/login',function(req,res){
       console.log("redirect");
       res.render('login', { title: 'login', message : req.flash('signinMessage')});
     });

    app.post("/login_confirm", function(req, res, next){
      console.log("login_check")
      passport.authenticate("local-signin", function(err, user){
        if(err){
          // return next(err);
          req.flash('signinMessage', err.message)
          return res.redirect('/login');
        }
        if(!user){
          console.log("login fail")
          req.flash('signinMessage', 'login fail')
          return res.redirect('/login');
        } else {
          req.logIn(user, function(err){
              if(err){ return next(err); }
              return res.redirect("/mypage/my_wallet?type=0");
          })
        }
      })(req, res, next)
    })

    //회원가입
     app.get('/registration',function(req,res){
       res.render('registration', { title: 'Member Join', short: '', message : req.flash('signupMessage')});
     });

     app.get('/r/:short',function(req,res){

        var short = req.params.short;

        let mydb = new Mydb(pool);
        const MQuery = require('./sqlMap/QUserDB'); // 여기

        mydb.execute( async conn => {
            var obj = {'short':short}

              MQuery.getShortURL(obj, conn).then(function(result) {
                res.render('registration', { title: 'Member Join',short : result[0].short , rcmmndrId : result[0].email_id, message : req.flash('signupMessage')});
              }).catch(function (err) {
                res.render('registration', { title: 'Member Join', short: '', message : req.flash('signupMessage')});
              });
          });
     });

     app.post('/isPassword' ,function(req,res,next){
       passport.authenticate("local-signin", function(err, user, info){
         if(err){ return next(err);}
         if(!user){
           res.send({result:false});
           //return res.redirect("/login", {message : req.flash('signinMessage')})
         } else {
           req.logIn(user, function(err){
               if(err){ return next(err); }
               res.send({result:true});
           })
         }
       })(req, res, next)
     });

     app.post('/tempPassword' ,function(req,res,next){
       console.log("tempPassword")
       console.log(req.body.email_id)
       console.log(req.body.password)
       passport.authenticate("local-signTemp", function(err, user, info){
         if(err){ return next(err);}
         if(!user){
           console.log("tempPassword false")
           res.send({result:false});
           //return res.redirect("/login", {message : req.flash('signinMessage')})
         } else {
           req.logIn(user, function(err){
               if(err){ return next(err); }
               res.send({result:true});
           })
         }
       })(req, res, next)
     });

     app.post('/passValidator',function(req,res){
       var password = req.body.password;
       var type = req.body.type;

       console.log("passValidator ===> type ::" + type)
       console.log(password)
       var schema = new passwordValidator();
       schema
      .is().min(8)                                    // Minimum length 8
      .is().max(12)                                  // Maximum length 100
      //.has().uppercase()                              // Must have uppercase letters
      //.has().lowercase()                              // Must have lowercase letters
      .has().digits()                                 // Must have digits
      .has().not().spaces()                           // Should not have spaces
      .has().symbols()                                // /[`~\!@#\$%\^\&\*\(\)\-_\=\+\[\{\}\]\\\|;:'",<.>\/\?€£¥₹]+/,
      //.is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values

      var result = schema.validate(password);
      console.log("password check ::" + result);
      if(result) {
        //회원가입
        if ( type == "01") {
          passport.authenticate("local-signup", function(err, user){

            if(err){
              console.log("error")
              res.send({code:"03",result:false, message : err.message});
            }

            res.send({result:true});
          })(req,res)
        } else if ( type == "02") {//업데이트
          passport.authenticate("local-changepass", function(err, user){
            if(err){
              console.log("error")
              res.send({code:"03",result:false, message : err.message});
            }
            res.send({result:true});
          })(req,res)
        }

      } else {
        res.send({code:"01",result:false, list: schema.validate(password, { list: true })});
      }
    });

   app.get('/reset_pw',function(req,res){
     console.log("reset_pw page1")
       res.render('reset_pw', {
           title: "Recover Login Credentials"
       })
   });

   app.post('/mailsender', function(req,res,next){
    var email_id = req.body.email_id;
    var initPass = require("./service/STempPass");
    var myInitPass = initPass(pool,email_id);
    myInitPass.randomKey(function(err,obj) {
      if(err) {
        console.log(err)
        res.send({result:false});
      } else {
        if (obj.result ) {
          sendEmail(email_id,obj.key, function(err, result) {
            console.log("=========sendEmail===========")
            if(err) {
              console.log("=========ERROR1===========")
              console.log(err);
              res.send({result:false});
           } else {
              console.log("result ::" + result);
              if(result == undefined) {
                res.send({result:false});
                console.log("=========ERROR2===========")
              }
              else {
                res.send({result:true});
              }
            }
          });
        } else {
          console.log("obj ::"+ obj);
          res.send({result:false, message:obj.message});
        }

      }
    })
 });
}
