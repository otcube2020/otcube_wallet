var CONSTS = require('../config/commConsts')


function uptRecomm(param, conn) {
    return new Promise((resolve, reject) => {

        var sql = "UPDATE tb_users SET recom_email_id = '"+parma.recom_email_id+"' WHERE email_id='"+param.email_id+"'";
        
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

function getEmailShortURL(param, conn) {
    return new Promise((resolve, reject) => {

        var sql = "SELECT short, full_url FROM tb_short_url WHERE email_id = '"+param.email_id+"'";
        
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

function getShortURL(param, conn) {
    return new Promise((resolve, reject) => {

        var sql = "SELECT email_id,short , full_url FROM tb_short_url WHERE short = '"+param.short+"'";
        
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

module.exports.uptRecomm = uptRecomm;

module.exports.getEmailShortURL = getEmailShortURL;
module.exports.getShortURL = getShortURL;