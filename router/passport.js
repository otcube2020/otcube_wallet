const crypto = require('crypto');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Mydb = require('./config/mydb');
var CONSTS = require('./config/commConsts')
var randomstring = require("randomstring");

module.exports = (pool) => {
  passport.serializeUser((user, done) => { // Strategy 성공 시 호출됨
    //console.log("passport.serializeUser call");
    done(null, user); // 여기의 user가 deserializeUser의 첫 번째 매개변수로 이동
  });

  passport.deserializeUser((user, done) => { // 매개변수 user는 serializeUser의 done의 인자 user를 받은 것
    return done(null, user);
  });

  passport.use(new LocalStrategy({ // local 전략을 세움
    usernameField: 'email_id',
    passwordField: 'password',
    session: true, // 세션에 저장 여부
    passReqToCallback: true, //passReqToCallback이라는 옵션은 인증을 수행하는 인증 함수로 HTTP request를 그대로  전달할지 여부를 결정한다.
  },function(req,email_id, password, done) {
      //console.log("email_id ::" + email_id);
      //console.log("password ::" + password);
      return done(null,false);
      //무사통과
      //var user = { 'email_id':email_id};
      //return done(null,user);
    }
  ));

  // 회원가입
 passport.use('local-signup', new LocalStrategy({ // local-signup이라는 전략을짭니다.
     usernameField: 'email_id', // 필드를 정해주는 것 입니다.
     passwordField: 'password',
     passReqToCallback: true  // request객체에 user의 데이터를 포함시킬지에 대한 여부를 결정
   }, function (req, email_id, password, done) {
     //base64 방식으로 문자열로 만들어서 저장
      crypto.randomBytes(64, (err, buf) => {

        crypto.pbkdf2(password, buf.toString('base64'), 108236, 64, 'sha512', (err, key) => {
          let mydb = new Mydb(pool);
          const MQuery = require('./sqlMap/QMembership'); // 여기

          mydb.execute( async conn => {
            var recom_email_id = req.body.recom_email_id;
            var obj = {
              'email_id':email_id,
              'password':key.toString('base64'),
              'salt': buf.toString('base64'),
              'create_user' : email_id ,
              'recom_email_id' : recom_email_id};

              MQuery.fnMemberSignup(obj, conn).then(function(result) {
                console.log(result)
                var user = { 'email_id':email_id,'msg':'success'};

                var short = randomstring.generate(8);
                obj.short = short;
                obj.fullURL = CONSTS.MYPAGE.FULL_URL+short;
                
                MQuery.QSetShortURL(obj, conn);

                return done(null, user);
                
              }).catch(function (err) {
                var message ="";
                if('1062' == err.errno) {
                  message = 'Invalid wallet E-Mail ID(Duplicate)';
                } else {
                  message = 'Join member insert error';
                }
                var user = { 'email_id':'null', 'msg':message};
                return done(null, user );
              });
          });
        });
      });
 }));

 passport.use('local-changepass', new LocalStrategy({ // local-signup이라는 전략을짭니다.
     usernameField: 'email_id', // 필드를 정해주는 것 입니다.
     passwordField: 'password',
     passReqToCallback: true  // request객체에 user의 데이터를 포함시킬지에 대한 여부를 결정
   }, function (req, email_id, password, done) {
     //base64 방식으로 문자열로 만들어서 저장
      crypto.randomBytes(64, (err, buf) => {
        crypto.pbkdf2(password, buf.toString('base64'), 108236, 64, 'sha512', (err, key) => {
          let mydb = new Mydb(pool);
          const MQuery = require('./sqlMap/QMembership'); // 여기

          mydb.execute( async conn => {
          
            var obj = {
              'email_id':email_id,
              'password':key.toString('base64'),
              'salt': buf.toString('base64'),
              'create_user' : email_id };

              MQuery.fnUptMember(obj, conn).then(function(result) {
                var user = { 'email_id':email_id,'msg':'success'};
                return done(null, user , { message:  req.flash('signinMessage', message) });
              }).catch(function (err) {
                var message ="";
                if('1062' == err.errno) {
                  message = 'Invalid wallet E-Mail ID(Duplicate)';
                } else {
                  message = 'Join member insert error';
                }
                var user = { 'email_id':'null', 'msg':message};
                return done(null, user , { message:  req.flash('signinMessage', message) });
              });
          });
        });
      });
 }));

//임시 비밀번호
 passport.use('local-signTemp', new LocalStrategy({ // local-signin 라는 전략을짭니다.
   usernameField: 'email_id',
   passwordField: 'password',
   passReqToCallback: true // 인증을 수행하는 인증 함수로 HTTP request를 그대로  전달할지 여부를 결정한다
 }, function(req, email_id, password, done){
    console.log("local-signTemp call :: email_id = " + email_id)
    let mydb = new Mydb(pool);
    const MQuery = require('./sqlMap/QMembership'); // 여기

    mydb.execute( async conn => {
        var obj = {};
        obj.email_id = email_id;

        MQuery.QGetTempPassword(obj, conn).then(async function(result) {
          if(result.length > 0 && result[0].temp_pass == password) {
              await MQuery.QDelTempPassword(obj,conn);
              
              if (err) {
                console.log("다시 시도하여 주세요")
                return done(null, false, { message:  req.flash('signinMessage', 'Please try again.') });
              }
   
              var user = { 'email_id':email_id};
              return done(null, user);
          
          } else {
            try {
              let rows = await MQuery.QGetUserInfo(obj,conn);
              if(rows.length == 0) {
                return done(null, false, req.flash('signinMessage', 'email does not exis.'));
              }

              crypto.pbkdf2(password, rows[0].salt, 108236, 64, 'sha512', (err, key) => {
                if(rows[0].password == key.toString('base64')) {
                  var user = { 'email_id':email_id,
                                'recom_email_id': rows[0].recom_email_id
                };
  
                  return done(null, user);
                } else {
                  return done(null, false, { message:  req.flash('signinMessage', 'The password is incorrect.') }); // 임의 에러 처리
                }
              });


            } catch (err) {
              console.log(err);
              return done(null, false, req.flash('signinMessage', 'email does not exis.'));
            }
              
   
           }
        }).catch(function (err) {
          var message ="";
          if('1062' == err.errno) {
            message = 'Invalid wallet E-Mail ID(Duplicate)';
          } else {
            message = 'Join member insert error';
          }
          var user = { 'email_id':'null', 'msg':message};
          return done(null, user , { message:  req.flash('signinMessage', message) });
        });
    });
 }));


 // 로그인
 passport.use('local-signin', new LocalStrategy({ // local-signin 라는 전략을짭니다.
   usernameField: 'email_id',
   passwordField: 'password',
   passReqToCallback: true // 인증을 수행하는 인증 함수로 HTTP request를 그대로  전달할지 여부를 결정한다
 }, function(req, email_id, password, done){
   console.log("local-signin email_id ::" + email_id);

    let mydb = new Mydb(pool);
    const MQuery = require('./sqlMap/QMembership'); // 여기

    mydb.execute( async conn => {
    
      var obj = {
        'email_id':email_id,
      };
      console.log("=======login check=======")
      MQuery.QGetUserInfo(obj, conn).then(async function(result) {
        console.log(result)
        if (result.length > 0) {
          try {
           
              MQuery.QGetTempPassword(obj,conn).then(async function(temp) {
                if( temp.length > 0) {
                  if(temp[0].temp_pass == password) {
                    var user = {
                      'email_id':email_id,
                      'recom_email_id': result[0].recom_email_id,
                      'address': result[0].address
                    };
                    await MQuery.QUptTempPassword(obj,conn).then(async function(temp) {

                    })
                    return done(null, user);
                  } else {
                    crypto.pbkdf2(password, result[0].salt, 108236, 64, 'sha512', (err, key) => {
                      if(result[0].password == key.toString('base64')) {
                        var user = {
                          'email_id':email_id,
                          'recom_email_id': result[0].recom_email_id,
                          'address': result[0].address
                        };
        
                        console.log("login Info :: %j",user)
                        return done(null, user);
                      } else {
                        return done({'message' :'Passwords do not match.'});
                      }
                    }); 
		  }
        
                } else {
                  crypto.pbkdf2(password, result[0].salt, 108236, 64, 'sha512', (err, key) => {
                    if(result[0].password == key.toString('base64')) {
                      var user = {
                        'email_id':email_id,
                        'recom_email_id': result[0].recom_email_id,
                        'address': result[0].address
                      };
      
                      console.log("login Info :: %j",user)
                      return done(null, user);
                    } else {
                      return done({'message' :'Passwords do not match.'});
                    }
                  });
                }
              }).catch((err) =>  {
                return done(err);
              });

            
            } catch (error) {
              console.log("===error====")
              console.log(error)
            }
        } else {
          return done({'message' :'User do not Join.'});
        }
      }).catch(function (err) {
        console.log("=======error=========")
        console.log(err)
        return done(err);
      });
    });
  }));
}
