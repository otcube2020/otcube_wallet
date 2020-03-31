const Mydb = require('../config/mydb');

/*
* 공통 코드 마스터 리스트
*/
function fnIsAddress(param, conn) {
    return new Promise(function(resolve, reject) {
        var select = "SELECT  count(1) as cnt FROM tb_wallet " 
        var where = " WHERE EMAIL_ID = '"+param.emailId+"'";
        var sql = select.concat(where);

        console.log(sql)
        conn.query(sql, (err, ret) => {        
            if (err) {     
                console.log(err)                        
                reject(err)          
            }            
            resolve(ret);
        });
    }); 
}

function fnInsAddress(param, conn) {    
    return new Promise(function(resolve, reject) {
        var insert = "INSERT INTO tb_wallet (EMAIL_ID, ADDRESS, PASSWORD, SALT , SEED, CREATE_USER)" 
        var value = " VALUES('"+param.emailId+"','"+param.address+"','"+param.password+"','"+param.salt+"','"+param.seed+"','"+param.emailId+"')";
        var sql = insert.concat(value);

        console.log(sql)
        try {
            conn.query(sql, (err, ret) => {        
                if (err) {     
                    console.log(err)                        
                    reject(err)          
                }            
                resolve(ret);
            });
        } catch (e) {
            console.log("=========================")
            reject(new Error("DB Error!"));
        }
        
    }); 
}

function fnGetAddress(param, conn) {
    return new Promise(function(resolve, reject) {
        var select = "SELECT ADDRESS as address, PASSWORD as password, SALT as salt, SEED as seed FROM tb_wallet " ;
        var where = " WHERE EMAIL_ID = '"+param.emailId+"'";
        var sql = select.concat(where);

        console.log(sql)
        conn.query(sql, (err, ret) => {        
            if (err) {     
                console.log(err)                        
                reject(err)          
            }
            console.log(ret)            
            resolve(ret);
        });
    }); 
}

function fnGetTxId(param, conn) {
    return new Promise(function(resolve, reject) {
        var sql = "SELECT TX_ID as txId FROM tb_transaction " ;
         sql += " WHERE EMAIL_ID = '"+param.emailId+"' AND ERR_YN = 'N' ";
         sql += " ORDER BY CREATE_USER DESC LIMIT 1 "
        
        console.log(sql)
        conn.query(sql, (err, ret) => {        
            if (err) {     
                console.log(err)                        
                reject(err)          
            }
            console.log(ret)            
            resolve(ret);
        });
    }); 
}

function fnInsTransaction(param, conn) {
    return new Promise(function(resolve, reject) {
        var insert = "INSERT INTO tb_transaction (EMAIL_ID, TX_ID, BALANCE, TO_ADDRESS, TX_DESC, ERR_YN, SEND_TYPE, CREATE_USER) ";
        var value = " VALUES('"+param.emailId+"','"+param.txId+"','"+param.balance+"','"+param.toAddress+"','"+param.desc+"','"+param.errYN+"','"+param.sendType+"','"+param.accountId+"')";
        var sql = insert.concat(value);

        console.log(sql)
        conn.query(sql, (err, ret) => {        
            if (err) {     
                console.log(err)                        
                reject(err)          
            }            
            resolve(ret);
        });
    }); 
}


module.exports.QIsAddress = fnIsAddress;
module.exports.QInsAddress = fnInsAddress;
module.exports.QGetAddress = fnGetAddress;
module.exports.QInsTransaction = fnInsTransaction;
module.exports.QGetTxId = fnGetTxId;






