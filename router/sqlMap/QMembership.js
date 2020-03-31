
var CONSTS = require('../../const/ErrorMsgConts')

function fnGetUserList(paramObj, conn) {
  return new Promise((resolve, reject) => {
      var sql = "SELECT * FROM tb_users where email_id = '"+paramObj.email_id+"' and use_yn = 'Y'"
      
      console.log(sql)
      conn.query(sql, (err, ret) => {
          var resultObj = {};
          if(err){
              reject(err);
          }else {
              resolve(ret);
          }
      });
  });
}

function fnGetUserInfo(param,conn) {
    return new Promise((resolve, reject) => {
        var sql   = " SELECT TBL1.email_id"
        sql  += " , TBL1.recom_email_id , TBL1.salt, TBL1.password"  
        sql  +=    " , COALESCE(TBL3.address,'') AS address"
        sql  +=    " FROM tb_users TBL1"
        sql  +=    " LEFT JOIN tb_wallet TBL3 ON TBL1.email_id = TBL3.email_id"
        sql  +=    " WHERE TBL1.email_id ='"+param.email_id+"'"
        sql  +=    " and use_yn = 'Y' "

        console.log(sql)
        conn.query(sql, (err, ret) => {
            var resultObj = {};
            if(err){
                reject(err);
            }else {
                resolve(ret);
            }
        });

    });
}

function fnMemberSignup(paramObj, conn) {
    return new Promise((resolve, reject) => {
        var sql = "INSERT INTO tb_users "
        sql += " ( email_id, password, salt, create_user )"
        sql += " values ('"+paramObj.email_id+"','"+paramObj.password+"' ,'"+paramObj.salt+"','"+paramObj.email_id+"')"

        console.log(sql)
        conn.query(sql, (err, ret) => {
            var resultObj = {};
            if(err){
                console.log(err)
                resultObj.result = false;
                if('1062' == err.errno) {
                    resultObj.msg = CONSTS.ERR.DUPLICATE
                } else {
                    resultObj.msg = CONSTS.ERR.SIGNUP
                }
                reject(resultObj);
            }else {
                resultObj.result = true;
                resultObj.msg = CONSTS.SUCCESS.SIGNUP;
                resolve(resultObj);
            }
        });
    });
}

//사용자 변경
function fnUptMember(paramObj,conn) {
    return new Promise(function(resolve, reject) {

        var sql = "UPDATE tb_users SET password = '"+paramObj.password+"' ,salt = '"+paramObj.salt+"' WHERE email_id = '"+paramObj.email_id+"'";

        conn.query(sql, (err, ret) => {
            var resultObj = {};
            if(err){
                resultObj.result = false;
                resultObj.msg = "Password change was fail.";
                reject(resultObj);
            }else {
                resultObj.result = true;
                resultObj.msg = "Password change was successful.";
                resolve(resultObj);
            }
        });
    
  });
}


//임시비밀번호 
function fnGetTempPassword(paramObj,conn) {
    return new Promise(function(resolve, reject) {
  
        var sql = "select email_id,temp_pass from tb_temp_pass where email_id = '"+paramObj.email_id+"' and DATE_FORMAT(CREATE_DATE, '%Y-%m-%d %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)";
          console.log(sql)
        conn.query(sql, (err, ret) => {
          if(err){
              reject(err);
          }else {
              resolve(ret);
          }
      });
    })
  }
  
  function fnUptTempPassword(paramObj,conn) {
      return new Promise(function(resolve, reject) {
    
          var sql = "update tb_temp_pass set use_yn = 'Y' where email_id = '"+paramObj.email_id+"' and use_yn='N'";
            console.log(sql)
          conn.query(sql, (err, ret) => {
            if(err){
                reject(err);
            }else {
                resolve(ret);
            }
        });
      })
    }
  
  function fnDelTempPassword(paramObj,conn) {
      return new Promise(function(resolve, reject) {
  
      var sql = "delete from tb_temp_pass where email_id = '"+paramObj.email_id+"'";
      
          conn.query(sql, (err, ret) => {
              if(err){
                  reject(err);
              }else {
                  resolve(ret);
              }
          });
      })
  }
  
  function fnInsTempPassword(paramObj,conn) {
      return new Promise( (resolve, reject) => {
          var sql = "INSERT INTO tb_temp_pass (email_id, temp_pass) VALUES ('"+paramObj.email_id+"', '"+paramObj.randomKey+"')";
          conn.query(sql, (err, ret) => {
              if(err){
                  reject(err);
              }else {
                  resolve(ret);
              }
          })
      })
  }

function fnSetShortURL(param, conn) {
    return new Promise((resolve, reject) => {

        var sql = "INSERT INTO tb_short_url (email_id, short, full_url) VALUES ('"+param.email_id+"', '"+param.short+"', '"+param.fullURL+"')";
        
        console.log(sql)
        conn.query(sql, (err, ret) => {
            var resultObj = {};
            if(err){
                reject(err);
            }else {
                resolve(ret);
            }
        });
    });
}

function fnGetShortURL(param, conn) {
    return new Promise((resolve, reject) => {
        var sql = "SELECT * FROM tb_short_url WHERE EMAIL_ID ='"+param.email_id+"'";
        
        console.log(sql)
        conn.query(sql, (err, ret) => {
            var resultObj = {};
            if(err){
                reject(err);
            } else {
                resolve(ret);
            }
        });
    });
}


module.exports.fnMemberSignup = fnMemberSignup;
module.exports.QGetTempPassword = fnGetTempPassword;
module.exports.QDelTempPassword = fnDelTempPassword;
module.exports.QInsTempPassword = fnInsTempPassword;
module.exports.QUptTempPassword = fnUptTempPassword;

module.exports.fnUptMember = fnUptMember;
module.exports.QGetUserInfo = fnGetUserInfo;
module.exports.QSetShortURL = fnSetShortURL;
module.exports.QGetShortURL = fnGetShortURL;
