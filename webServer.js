var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var fs = require("fs")

/*
* DB config
*/
const Pool = require('./router/config/pool');
const pool = new Pool();

global.__lib = __dirname + '/lib/';

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

var passport = require('passport') //passport module add
const passportConfig = require('./router/passport'); // 여기

var flash = require('connect-flash');

//secret – 쿠키를 임의로 변조하는것을 방지하기 위한 sign 값 입니다. 원하는 값을 넣으면 됩니다.
//resave – 세션을 언제나 저장할 지 (변경되지 않아도) 정하는 값입니다. express-session documentation에서는 이 값을 false 로 하는것을 권장하고 필요에 따라 true로 설정합니다.
//saveUninitialized – uninitialized 세션이란 새로 생겼지만 변경되지 않은 세션을 의미합니다. Documentation에서 이 값을 true로 설정하는것을 권장합니다.
 app.use(session({
   cooke: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        expires: 7200000,
        httpOnly: true
    },
  resave: false,
  saveUninitialized: false,
  secret: 'GBT!*Session'
})); // 세션 활성화

// flash는 세션을 필요로합니다. session 아래에 선언해주셔야합니다.
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passportConfig(pool);

app.set('pool',pool);

var router1 = require('./router/main')(app, pool);

var router2 = require('./router/mypage')(app, pool);

var server = app.listen(3000, function(){
 console.log("Express server has started on port 3000")
});
