/*
* password 설정 모듈
*/
const Mydb = require('../config/mydb');
var randomstring = require("randomstring");

module.exports = function (pool,email_id,callback) {
  return {
    randomKey:  function(callback) {
      let mydb = new Mydb(pool);
      const MQuery = require('../sqlMap/QMembership'); // 여기
      var obj = {};
      obj.email_id = email_id;
      mydb.execute( async conn => { 
        try {
          let rows = await MQuery.QGetUserInfo(obj, conn) 
          if(rows.length == 0) {
            conn.release();
            var rtnObj = {result:false, message:"not member join"};
            return callback(null,rtnObj);
          }

          try {
            let tRows = await MQuery.QGetTempPassword(obj, conn) 
            console.log(obj)
            console.log(tRows)
            if(tRows.length > 0) {
              await MQuery.QDelTempPassword(obj, conn) 
            }
            obj.randomKey = randomstring.generate(7);
            await MQuery.QInsTempPassword(obj,conn)
            var retObj = {result:true, key:obj.randomKey};
            return callback(null,retObj);

          } catch (err) {
            return callback(err);
          }
          

        } catch(err) {
            return callback(err);
        }
        
      });
   
       
     }
   }
}
