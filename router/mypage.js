var passport = require('passport');
var randomstring = require("randomstring");
var CONSTS = require('./config/commConsts')
const Mydb = require('./config/mydb')
const request = require('request')
var web3tx = require("./config/web3tx");

function ensureAuthenticated(req, res, next) {
    // 로그인이 되어 있으면, 다음 파이프라인으로 진행
    if (req.isAuthenticated()) { return next(); }
    // 로그인이 안되어 있으면, login 페이지로 진행
    else {
      console.log("login fail ::" + req.user);
      res.redirect('/login');
    }
}


async function fnGetBalacne(address, callback) {

  
  
  let obj = {};
  obj.address = address;
  try {
    let ether = await web3tx.getEthBalance(obj);
    let token = await web3tx.getTokenBalance(obj);

    return callback(null,{'ether':ether, 'token':token});
  } catch (_err) {
    return callback(_err);
  }
  

} 

function fnSendTransaction(param,pool) {
  return new Promise(function(resolve, reject) {
      let BService = require('./service/SBlockchain'); // 여기
      console.log(param)
      var content = BService(param,pool);

      content.sendTransaction(function(err,ret) {
          console.log("==> sendTransaction result ")
          console.log(ret);
          if (err) {     
              console.log(err);
              reject(err);          
          }            
          resolve(ret);
      });
  });
}

function fnRender(res,usr,_usr,_key,_address,eth,token,msg,_type) {
  res.render(usr, {
    user: _usr,
    key : _key,
    address: _address,
    eth_balance : eth,
    token_balance : token,
    message : msg,
    type : _type
  });
}

function fnMypage(res,usr,_usr,_key,_address,eth,token,msg,_type,rate) {
  res.render(usr, {
    user: _usr,
    key : _key,
    address: _address,
    eth_balance : eth,
    token_balance : token,
    message : msg,
    type : _type,
    rate:rate
  });
}

function fnProfileRender(res,obj) {
  res.render(obj.path, {
    user: obj.emailId,
    key : obj.menu,
    address: obj.address,
    eth_balance : obj.ethBalance,
    token_balance : obj.tokenBalance,
    message : obj.msg,
    recom_email_id : obj.recom_email_id,  
    type : ''
  });
}

module.exports = function(app, pool)
{
    app.get('/mypage/my_wallet', ensureAuthenticated,  function(req,res){

        //res.send(req.user)
        var email_id = req.user.email_id;
        var _type = req.query.type;
        console.log("===============",_type)

        if(_type == "undefined") {
            res.redirect('/mypage/my_wallet?type=0');
        }

        var obj = {};
        obj.emailId = email_id;
        let mydb = new Mydb(pool);
        const MQuery = require('./sqlMap/QBlockchain'); // 여기

        mydb.execute( async conn => {
            MQuery.QGetAddress(obj, conn).then(function(result) {
              obj.address = "";           
              if (result.length > 0) {
                obj.address = result[0].address;  
                fnGetBalacne(obj.address, async function(err, _result){
                  console.log("fnGetBalance end ::" + _result)
                  if(err) {
                    console.log(err);
                    fnMypage(res,'mypage/my_wallet',req.user.email_id,1,obj.address,0,0,'',_type,'');
                    return;
                  }
                  
                  obj.ether = _result.ether;
                  obj.token = _result.token;

                  let mydb = new Mydb(pool);
                  const MTransaction = require('./sqlMap/QTransactionDB'); // 여기

                  obj.episoid = 1;
                  let rate = await web3tx.getRate(obj);
                  mydb.execute( async conn => {
                    MTransaction.QSetTransaction(obj, conn).then(function(_ret) {
                      
                      
                      fnMypage(res,'mypage/my_wallet',req.user.email_id,1,obj.address,obj.ether,obj.token,'',_type,rate);
                    }).catch(function (err) {
                      fnMypage(res,'mypage/my_wallet',req.user.email_id,1,obj.address,obj.ether,obj.token,'',_type,rate);
                    });
                  });
                });
              } else {
                console.log("no create ethereum")
                fnMypage(res,'mypage/my_wallet',req.user.email_id,1,obj.address,0,0,0,_type,'');
              }
            }).catch(function (err) {
              console.log(err)
              fnMypage(res,'mypage/my_wallet',req.user.email_id,1,obj.address,0,0,0,_type,'');
            });
        });
    });

    app.post('/mypage/send_tx', ensureAuthenticated, async function(req,res){
      var email_id = req.user.email_id;
      var _from = req.body.from;
      var _to = req.body.to;
      var _amt = req.body.amt;
      var sendType = req.body.sendType;

      if(email_id == "") {
        res.send({result:false, message:"not send"});
        return true;
      }
      if(_from == "") {
        res.send({result:false, message:"not send"});
        return true;
      }
      if(_to == "") {
        res.send({result:false, message:"not send"});
        return true;
      }
      if(_amt == "") {
        res.send({result:false, message:"not send"});
        return true;
      }
      if(sendType == "") {
        res.send({result:false, message:"not send"});
        return true;
      }
      var obj = {};
      obj.emailId = email_id;      
      obj.fromAddress = _from;
      obj.toAddress = _to;
      
      obj.balance = _amt;
      obj.sendType = sendType;
  
      console.log("===========sendType==========")
      console.log(sendType)
              
      console.log("Ether Send Start ~~")
      var ret = await fnSendTransaction(obj,pool);

      if (ret.isSuccess == true ) {
        res.send({result:true, message:obj.txId});
        return true;
      } else {
        res.send({result:false, message:ret.message});
        return true;
      }
    })

    app.get('/mypage/transaction', ensureAuthenticated, function(req,res){

      var email_id = req.user.email_id;
      
      let mydb = new Mydb(pool);
      const MQuery = require('./sqlMap/QWalletDB'); // 여기
      var obj = {};
      obj.email_id = email_id;

      mydb.execute( async conn => {
        MQuery.QGetAddress(obj, conn).then(function(result) {
          if(result.key != "") {
            fnGetBalacne(result.key, function(err, result){
              if(err) console.log(err);
              fnRender(res,'mypage/transactions',req.user.email_id,2,result.key,result.ether,result.token,'');
            });
          } else {
            fnRender(res,'mypage/transactions',req.user.email_id,2,result.key,0,0,'');
          }
        }).catch(function (err) {
          fnRender(res,'mypage/transactions',req.user.email_id,2,result.key,0,0,'');
        });
      });
    });


    app.get('/mypage/profile', ensureAuthenticated, async function(req,res){

      var email_id = req.user.email_id;
      var recom_email_id = req.user.recom_email_id;
      var shortURL = req.user.shortURL;
      var address = req.user.address;
      var short = req.user.short;

      var paramObj = {}
      paramObj.path = 'mypage/profile';
      paramObj.emailId = email_id;
      paramObj.menu = 3;
      paramObj.address = address;
      paramObj.ethBalance = 0;
      paramObj.tokenBalance = 0;
      paramObj.msg = '';
      paramObj.recom_email_id = recom_email_id;      

      let mydb = new Mydb(pool);
      const MQuery = require('./sqlMap/QBlockchain'); // 여기
      console.log("====profile call====")
      mydb.execute( async conn => {
        console.log("=============")
        MQuery.QGetAddress(paramObj, conn).then(async function(result) {
          console.log("=======QGetAddress========");
          console.log(result)
          if (result.key == '') {
            request.post('/create_wallet', {
              json: {
                email_id: email_id
              }
            }, (error, res, body) => {
              if (error) {
                console.error(error)
                return
              }
              console.log("=======QGetAddress create_wallet request ========");
              console.log(body)
            })
          } else {            
            console.log("=============resulst.key==========")
            console.log(paramObj.address)

            fnGetBalacne(paramObj.address, function(err, _result){             
              if(err) {
                console.log(err);                
              }
              paramObj.ethBalance = _result.ether;
              paramObj.tokenBalance = _result.token;
              
              fnProfileRender(res,paramObj)
            });

          }
          
        }).catch(function (err) {
          console.log(err)
          res.render('/login', { title: 'Member Join', short: '', message : req.flash('signupMessage')});
        });
      });

      

      console.log("profile end")
    });

    app.post('/mypage/change_pass',passport.authenticate('local-changepass', {
       failureRedirect: '/mypage/profile', failureFlash: true}), // 인증 실패 시 401 리턴, {} -> 인증 스트레티지
       function (req, res) {
         res.redirect('/mypage/profile');
     });

    app.get('/mypage/logout', function (req, res) {
      req.logout();
      res.redirect('/');
    });

    app.post('/create_wallet', ensureAuthenticated, function(req,res){
      console.log("========create_wallet start========")
        var obj = {};
        obj.emailId = req.user.email_id;

        //기존 주소 생성 체크
        let BService = require('./service/SBlockchain'); // 여기
        var content = BService(obj,pool);
        content.isAddress(function(err,ret) {
          console.log(err)
          console.log(ret)
          if(err || !ret.isAddress) {
            console.log("db insert Error");
            obj.result = false;
            obj.wallet = '';
            res.send(obj);
          } else {
            console.log(ret);  
            obj.result = true;
            obj.wallet = ret.address;
            res.send(obj);
          } 
        });
        console.log("========create_wallet end========")
       

   });

   //=============Contract Info Search================
   app.get('/mypage/getSaleBalance/:sale',  function(req,res){
         //res.send(req.user)
        console.log("getSaleBalance call")
        var sale = req.params.sale;
        var web3tx = require("./web3tx");
        var myWeb3tx = web3tx(sale,"","","","","");

        myWeb3tx.getSaleBalance(function(_err,result) {
            if(_err)  {
                console.log(_err)
                res.send({result:false, message:"SaleBalance Search Fail!!"});
                return true;
            } else {
                res.send({result:true, message:result});
            } //else
        }) //newAccount
     });

     app.get('/mypage/getTokenTotalSale/:sale',  function(req,res){
        //res.send(req.user)
       console.log("getTokenTotalSale call")
       var sale = req.params.sale;
       var web3tx = require("./web3tx");
       var myWeb3tx = web3tx(sale,"","","","","");

       myWeb3tx.getTokenTotalSale(function(_err,result) {
           if(_err)  {
               console.log(_err)
               res.send({result:false, message:"getTokenTotalSale Search Fail!!"});
               return true;
           } else {
               res.send({result:true, message:result});
           } //else
       }) //newAccount
    });

    app.get('/mypage/getCheckSale',  function(req,res){
        //res.send(req.user)
       console.log("getTokenTotalSale call")
       var sale = req.params.sale;
       var web3tx = require("./web3tx");
       var myWeb3tx = web3tx("","","","","","");

       myWeb3tx.getCheckSale(function(_err,result) {
           if(_err)  {
               console.log(_err);
               res.send({result:false, message:"getCheckSale Search Fail!!"});
               return true;
           } else {
               res.send({result:true, message:result});
           } //else
       }) //newAccount
    });

    app.get('/mypage/getSeasonSupply/:sale',  function(req,res){
        //res.send(req.user)
       console.log("getSeasonSupply call")
       var sale = req.params.sale;
       var web3tx = require("./web3tx");
       var myWeb3tx = web3tx(sale,"","","","","");

       myWeb3tx.getSeasonSupply(function(_err,result) {
           if(_err)  {
               console.log(_err)
               res.send({result:false, message:"getSeasonSupply Search Fail!!"});
               return true;
           } else {
               res.send({result:true, message:result});
           } //else
       }) //newAccount
    });

  app.post('/profile/rcmmndrAdd', ensureAuthenticated, function(req,res){
      var email_id = req.user.email_id;

      let mydb = new Mydb(pool);
    const MQuery = require('./sqlMap/QMembership'); // 여기

    mydb.execute( async conn => {
      var short = randomstring.generate(8);
      var obj = {
        'email_id':email_id,
        'short' : short,
        'fullURL' : CONSTS.MYPAGE.FULL_URL+short
      };
     
      MQuery.QSetShortURL(obj, conn).then(async function(result) {
        obj.resut = true;
        res.send(obj);
      }).catch(function (err) {
        console.log("=======error=========")
        console.log(err)
        obj.resut = false;
        res.send(obj);
      });
    });
  });
    
  app.post('/profile/rcmmndrList', ensureAuthenticated, function(req,res){
      var email_id = req.user.email_id;

      console.log("body param -> email_id ::"+email_id)
      let mydb = new Mydb(pool);
      const MQuery = require('./sqlMap/QMembership'); // 여기
      var obj = {};
      obj.email_id = email_id;
  
      mydb.execute( async conn => {
          MQuery.QGetShortURL(obj, conn).then(function(ret) {
              obj.result = true;
              obj.list = ret;
              res.send(obj);
          }).catch(function (err) {
              console.log(err)
              obj.result = false;
              obj.wallet = '';
              res.send(obj);
              return true;
          });
      });
  });
  

}
