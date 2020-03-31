
function fnSetTransaction(paramObj, conn) {
    return new Promise((resolve, reject) => {
        var sql = "INSERT INTO tb_transaction (email_id, to_addr, amt, send_type, tx, check_yn ) VALUES ('"+email_id+"', '"+to_addr+"', '"+amt+"', '"+send_type+"', '"+tx+"', 'N')";
       
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


  module.exports.QSetTransaction = fnSetTransaction;