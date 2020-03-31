function isWallet(paramObj, conn) {
    return new Promise((resolve, reject) => {
        var sql = "select * from tb_wallet where email_id = '"+paramObj.email_id+"'"
        
        console.log(sql)
        conn.query(sql, (err, ret) => {
            var resultObj = {};
            if(err){
                reject(err);
            }else {
                if(ret.length == 0) {
                    resolve({result:true});
                } else {
                    resolve({result:false});
                }
            }
        });
    });
}


function setAddress(paramObj, conn) {
    return new Promise((resolve, reject) => {
        var sql =  "INSERT INTO tb_wallet (email_id, address, wallet_pass) VALUES ('"+paramObj.email_id+"', '"+paramObj.address+"', '"+paramObj.randomKey+"')";
        
        console.log(sql)
        conn.query(sql, (err, ret) => {
            var resultObj = {};
            if(err){
                reject(err);
            }else {
                resolve({result:true});
            }
        });
    });
}  

function getAddress(paramObj, conn) {
    return new Promise((resolve, reject) => {
        var sql = "select * from tb_wallet where email_id = '"+paramObj.email_id+"'"
        
        console.log(sql)
        conn.query(sql, (err, ret) => {
            var resultObj = {};
            if(err){
                reject(err);
            }else {
                if(ret.length == 0) {
                    resolve({result:true, key:""});
                } else {
                    resolve({result:true, key:ret[0].address});
                }

            }
        });
    });
}

function getPwd(paramObj, conn) {
    return new Promise((resolve, reject) => {
        var sql = "select * from tb_wallet where email_id = '"+paramObj.email_id+"'"
        
        console.log(sql)
        conn.query(sql, (err, ret) => {
            
            console.log(ret)
            if(err){
                reject(err);
            }else {
                var resultObj = {};

                if(ret.length == 0) {
                    resultObj.result = true;
                    resultObj.key = "";
                    resolve(resultObj);
                } else {
                    resultObj.result = true;
                    resultObj.key = ret[0].wallet_pass;
                    console.log("===resultObj===")
                    console.log(resultObj)
                    resolve(resultObj);
                }

            }
        });
    });
}

module.exports.QIsWallet = isWallet;
module.exports.QSetAddress = setAddress;
module.exports.QGetAddress = getAddress;
module.exports.QGetPwd = getPwd;