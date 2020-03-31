const Mydb = require('../config/mydb');
const randomstring = require("randomstring");
const crypto = require('crypto');
const request = require('request');
var web3tx = require("../config/web3tx");

function fnSendTransaction(txObj,pool) {
    return new Promise(async function(resolve, reject) {
        let mydb = new Mydb(pool);
        const BQuery = require('../sqlMap/QBlockchain'); // 여기
        var ret = {};

        try {
            let txRet = await web3tx.sendTransaction(txObj)
            if (txRet.code == 0) {
                ret.isSuccess = true;
                ret.message = txRet.message;
                ret.txId = txRet.message;
                ret.fee = txRet.fee;

                txObj.txId = txRet.message;
                txObj.errYN = 'N';
                txObj.desc = '';
                mydb.execute( conn => {
                    BQuery.QInsTransaction(txObj,conn).then(function(txRet) {
                        resolve(ret);
                    }).catch(function (err) {
                        console.log("======sendTransaction Insert Error=======");
                        var date = new Date();
                        console.log("sendTransaction Insert Error ::"+ date);
                        console.log(err);
                        resolve(ret);
                    });
                });
            } else {
                ret.isSuccess = false;
                ret.message = txRet.message;

                txObj.txId = '';
                txObj.desc = txRet.message;
                txObj.errYN = 'Y';

                mydb.execute( conn => {
                    BQuery.QInsTransaction(txObj,conn).then(function(___ret) {
                        resolve(ret);
                    }).catch(function (err) {
                        console.log("======sendTransaction Insert Error=======");
                        var date = new Date();
                        console.log("sendTransaction Insert Error ::"+ date);
                        console.log(err);
                        resolve(ret);
                    });
                });
            }

        } catch (_err) {
            console.log(" sendTransaction sendTransaction error ")
            console.log(_err)
            ret.isSuccess = false;
            ret.message = "전송에 실패 하였습니다. 다시 시도하여 주시가나 관리자에게 문의 바랍니다.";
            resolve(ret);
        }


    });
  }


module.exports = function (obj, pool, callback) {
    return {
        //
        /*
        * param : null
        * DESC  : 공통코드 마스터 입력
        */
        isAddress : function(callback) {
            //mysql pool 에서 객체를 가져온다.
            let mydb = new Mydb(pool);
            const BQuery = require('../sqlMap/QBlockchain'); // 여기

            mydb.execute( conn => {
                BQuery.QIsAddress(obj, conn)
                .then(function(result) {
                    var ret = {};
                    if (result[0].cnt == 0) {
                        ret.isAddress = true;
                        //return callback(null,ret);

                        crypto.randomBytes(64, (err, buf) => {
                            crypto.pbkdf2(obj.emailId, buf.toString('base64'), 108236, 64, 'sha512', async (err, key) => {
                                var password  = key.toString('base64');
                                var salt = buf.toString('base64');

                                let createObj = {};
                                createObj.password = password.substring( 0, 10 );
                                try {
                                    let retAddr = await web3tx.newAccount(createObj)
                                    var pObj = {
                                        'emailId'       : obj.emailId,
                                        'address'       : retAddr.address,
                                        'seed'          : retAddr.seed,
                                        'password'      : password,
                                        'salt'          : salt
                                    };

                                    BQuery.QInsAddress(pObj,conn).then(function(_ret) {
                                        if(err) {
                                            console.log(err);
                                            ret.isAddress = false;
                                            return callback(null,ret);
                                        } else {
                                            ret.isAddress = true;
                                            ret.address = retAddr.address;
                                            return callback(null,ret);
                                        }
                                    });

                                } catch (e) {
                                    ret.isAddress = false;
                                    return callback(null,ret);
                                }
                            });
                        });
                    } else {
                        ret.isAddress = false;
                        return callback(null,ret);
                    }

                }).catch(function (err) {
                        console.log(err);
                        ret.isAddress = false;
                        return callback(null,ret);
                });
            })
        },
        sendTransaction : function(callback) {
            //mysql pool 에서 객체를 가져온다.
            var fromAddress = obj.fromAddress;
            var toAddress = obj.toAddress;
            var balance = obj.balance;
            let mydb = new Mydb(pool);
            const BQuery = require('../sqlMap/QBlockchain'); // 여기

            mydb.execute( conn => {
                BQuery.QGetAddress(obj,conn).then(async function(_ret) {

                    var password = _ret[0].password;
                    var seed = _ret[0].seed;

                    var txObj = {};
                    txObj.emailId       = obj.emailId;
                    txObj.seed          = seed;
                    txObj.fromAddress   = fromAddress;
                    txObj.address       = fromAddress;
                    txObj.toAddress     = toAddress;
                    txObj.balance       = balance;
                    txObj.password      = password.substring(0,10);
                    txObj.sendType      = obj.sendType;

                    //이더로 컨트랙트 토큰 구매시
                    if ( obj.toAddress.toUpperCase() == "0x0000000000000000000000000000000000000000".toUpperCase()) {
                        txObj.sendType = "S"
                    }

                    console.log("========================getEthBalance ::" + fromAddress)
                    try {
                        let ethBalance = await web3tx.getEthBalance(txObj)

                        if ( obj.sendType != 'T') {
                            if (parseFloat(ethBalance) < parseFloat(balance)) {
                                var ret = {};
                                ret.isSuccess = false;
                                ret.message = "보유 ETH 보다 전송 ETH 가 많습니다. 잔액을 확인 후 다시 시도하여 주세요";
                                return callback(null,ret);
                            }
                        }
                    } catch (e) {
                        console.log(" sendTransaction getBalance error ")
                        console.log(_err)
                        var ret = {};
                        ret.isSuccess = false;
                        ret.message = "전송에 실패 하였습니다. 다시 시도하여 주시가나 관리자에게 문의 바랍니다.";
                        return callback(null,ret);
                    }



                    // pending 된 경우가 있을 경우 pending 완료 까지 다음 진행을 하면 된다.
                    BQuery.QGetTxId(obj,conn).then(async function(_ret) {
                        if(_ret.length > 0) {
                            txObj.txid =  _ret[0].txId;
                            try {
                                let txRet = await web3tx.getReceipt(txObj)
                                if (txRet) {
                                    if(txRet.status) {
                                        console.log("==== sendTransaction -> Start =====")
                                        var ret = await fnSendTransaction(txObj,pool);
                                        return callback(null,ret);
                                    } else {
                                        var ret = {};
                                        ret.isSuccess = false;
                                        ret.message = "현재 진행중인 전송 건이 있습니다. 완료 후 다시 시도하여 주세요";
                                        console.log("현재 진행중인 전송 건이 있습니다. 완료 후 다시 시도하여 주세요");
                                        return callback(null,ret);
                                    }
                                } else {
                                    var ret = {};
                                    ret.isSuccess = false;
                                    ret.message = "현재 진행중인 전송 건이 있습니다. 완료 후 다시 시도하여 주세요";
                                    console.log("현재 진행중인 전송 건이 있습니다. 완료 후 다시 시도하여 주세요");
                                    return callback(null,ret);
                                }

                            } catch (e) {
                                console.log(_err);
                                var ret = {};
                                ret.isSuccess = false;
                                ret.message = "현재 진행중인 전송 건이 있습니다. 완료 후 다시 시도하여 주세요";
                                console.log("현재 진행중인 전송 건이 있습니다. 완료 후 다시 시도하여 주세요");
                                return callback(null,ret);
                            }

                        } else {
                            console.log("txId 존재하지 않음")
                            var ret = await fnSendTransaction(txObj,pool);
                            return callback(null,ret);
                        }
                    }).catch(function (err) {
                        console.log("=============")
                        console.log(err)
                    });



                }).catch(function (err) {
                    console.log(" sendTransaction getBalance error ")
                    console.log(err)
                    var ret = {};
                    ret.isSuccess = false;
                    ret.message = "전송에 실패 하였습니다. 다시 시도하여 주시가나 관리자에게 문의 바랍니다.";
                    return callback(null,ret);
                });
            })
        }
    } //return
};//module
