var Web3    = require('web3')
var CONSTS  = require('./commConsts');
var request = require('request');
var fs = require('fs');

var web3js = new Web3(new Web3.providers.HttpProvider(CONSTS.BLOCKCHAIN.INFUA_PORVIDERS));
const contractAddress = CONSTS.BLOCKCHAIN.CONTRACT;
const mainAddress = CONSTS.BLOCKCHAIN.MAIN_ADDRESS;
const mainPass = CONSTS.BLOCKCHAIN.MAIN_PASS

//64 자리수 채우기
function fnConcat(s) {
    var _64bit = '0000000000000000000000000000000000000000000000000000000000000000';
    var _fill = _64bit.substring(0,_64bit.length - s.length);
    console.log("_fill ::" + _fill)
    return _fill+s;
}

const isAccount = async function isAccount(_to) {
    var _isAccount = web3js.utils.isAddress(_to);

    return _isAccount;
};

function fnNewAccount(param) {
    return new Promise( (resolve, reject) => {  
        try {
            const Mnemonic = require('bitcore-mnemonic');  
            const EC = require('elliptic').ec;
            const keccak256 = require('js-sha3').keccak256;

            // 니모닉 코드 생성
            var code = new Mnemonic(Mnemonic.Words.ENGLISH);

            // 니모닉 코드에서 개인키 생성
            var hdKey = code.toHDPrivateKey(param.password);

            var derivationPath = "m/44'/60'/0'/0'";

            var priKey = hdKey.derive(derivationPath).privateKey;
            var pubKey = hdKey.derive(derivationPath).publicKey;

            const ec = new EC('secp256k1');
            // Decode public key
            const key = ec.keyFromPublic(pubKey.toString(), 'hex');
            // Convert to uncompressed format
            const _publicKey = key.getPublic().encode('hex').slice(2);
            // Now apply keccak
            const address = keccak256(Buffer.from(_publicKey, 'hex')).slice(64 - 40);
            
            var result = {};
            result.seed = code.toString();
            result.priKey = priKey.toString();
            result.address = "0x"+address.toString();

            resolve(result);
        } catch (err) {
            return reject(err);
        }  
    })
  }

  function fnGetEthBalance(param) {
    return new Promise(function(resolve, reject) {
      var date = new Date();
      console.log("getBalance time ::", date ,param.address);
if(param.address) {
        web3js.eth.getBalance(param.address, function(err, result) { 
            if(err)  {
                console.log(err)
                reject(err)
            } else {
                console.log("ether ::"+ web3js.utils.fromWei(result, "ether"))
                resolve(web3js.utils.fromWei(result, "ether"));
            }
        });   
      } else {
        resolve("0")
      }
        
    });
  }

  function fnGetTokenBalance(param) {
    return new Promise( (resolve, reject) => {      
        let callData = "0x70a08231"
        let _to = fnConcat((param.address).substring(2))
        let contractData = (callData + _to);
        
        web3js.eth.call({
            to: contractAddress, 
            data: contractData 
        }, function(err, result) {
            if (result) {
              resolve(web3js.utils.fromWei(result, "ether"));
            } else {
                console.log(err); // Dump errors her
                reject(err)
            }
        });
    })
  }

  function fnGetReceipt(param) {
    return new Promise(function(resolve, reject) {
        web3js.eth.getTransactionReceipt(param.txid, function (error, result) {
            if(error)  {
                reject(err)
            } else {         
                resolve(result);
            }
        }).catch((err)=>{
                console.log(err)
                reject(err)
        })    
    })
  }

  function fnSendTransaction(param){
    return new Promise(function(resolve, reject) {
        isAccount(param.toAddress).then(_isAccount => {            
            if(_isAccount == true) {
                request('https://ethgasstation.info/json/ethgasAPI.json', async function (error, res, data) {
                    var gasObj = {};              
                    if (error) {
                        console.log(error) ;  
                        gasObj.limit = '21000';
                        gasObj.price = '20';
                    } else {
                        var jsonData = JSON.parse(data);                         
                        gasObj.limit = '21000';
                        gasObj.price = Math.ceil((Number(jsonData.fast)/10));
                    }

                    try {
                        var privateKey = "";
                        var gasPrice = gasObj.price * 1e9;
                        var totPrice = (Math.ceil(gasPrice*21000))+"";                         
                        var _fee = web3js.utils.fromWei(totPrice,'ether');

                        var tx = {};
                        
                        tx.nonce= await web3js.eth.getTransactionCount(param.fromAddress,'pending');
                        if (param.sendType == 'T' ) {                        
                            //token send  
                            tx.gasLimit= web3js.utils.toHex('450000');
                            tx.gasPrice = web3js.utils.toHex(gasPrice); 
                            tx.to = contractAddress;
                            var tokenValue = web3js.utils.toHex(web3js.utils.toWei(param.balance, 'ether'));                               
                            tx.data = '0xa9059cbb'+fnConcat(param.toAddress.substring(2))+fnConcat(tokenValue.substring(2));                             
                            tx.value = '0x0'; 
                        } else {
                            var amount = param.balance;                                
                            tx.to = param.toAddress;                              
                            tx.value = web3js.utils.toHex(web3js.utils.toWei(amount, "ether"));
                            tx.gasPrice = web3js.utils.toHex(gasPrice); 
                            if (param.toAddress.toLowerCase() == CONSTS.BLOCKCHAIN.CONTRACT.toLowerCase()) {                                
                                tx.gasLimit= web3js.utils.toHex('450000');                                 
                            } else {
                                tx.gasLimit= web3js.utils.toHex(gasObj.limit); 
                            }
                        }

                        var Mnemonic = require('bitcore-mnemonic');
                        // 복원용 니모니 단어
                        var words = param.seed;
                        // 니모닉 단어로 부터 개인키 복원
                        var hdKey = Mnemonic(words).toHDPrivateKey(param.password);
                        var derivationPath = "m/44'/60'/0'/0'";
                        var privateKey = Buffer.from(hdKey.derive(derivationPath).privateKey.toString(), 'hex').toString('hex')
                        
                        const signed = await web3js.eth.accounts.signTransaction(tx, privateKey);
                        const rawTx = signed.rawTransaction;


                        web3js.eth.sendSignedTransaction(rawTx)                        
                        .once('transactionHash', (hash) => {
                            resolve({code:0, message: hash, fee:_fee})
                        }).catch(err => {
                           if ( err.message.indexOf("insufficient") > 0) {
                                resolve({code:-1, message: "There is more transfer ETH than holding ETH. Please check your balance and try again"})
                            } else {
                                resolve({code:-1, message: err.message.replace(":", "")})
                            }
                            
                            console.log("result2\":\"\", \"code\" :\"-1\", \"message\":\""+err.message.replace(":", "")+"\"" ); 
                        });
                    } catch(err) {
                        console.log("result3\":\"\", \"code\" :\"-1\", \"message\":\""+err.message.replace(":", "")+"\"" );
                        resolve({code:-1, message: err.message.replace(":", "")})                        
                    }
                }); 
            } else {
                console.log("\"result4\":\"\", \"code\" :\"-3\", \"message\":\"Not Vaild To Address\"");
                resolve({code:-3, message: "Not Vaild To Address"})
            }
        }).catch((error) => {
            console.log("\"result5\":\"\", \"code\" :\"-3\", \"message\":\"Not Vaild To Address\"");
            resolve({code:-3, message: "Not Vaild To Address"})
        });
    })
}

function fnGetRate(param) {   
    return new Promise( (resolve, reject) => {      
        let callData = "0x57764094"
        let _episoid = fnConcat(web3js.utils.toHex(param.episoid).substring(2));
        let contractData = (callData + _episoid);
        
        web3js.eth.call({
            to: contractAddress, 
            data: contractData 
        }, function(err, result) {
            if (result) {                          
              resolve((parseInt(result,16)).toString(10));
            } else {
                console.log(err); // Dump errors her
                reject(err)
            }
        });
    })
  }

module.exports.newAccount = fnNewAccount;
module.exports.getEthBalance = fnGetEthBalance;
module.exports.getTokenBalance = fnGetTokenBalance;
module.exports.getReceipt = fnGetReceipt;
module.exports.sendTransaction = fnSendTransaction;
module.exports.getRate = fnGetRate;
