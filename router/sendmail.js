const nodemailer = require('nodemailer');
const smtpPool = require('nodemailer-smtp-pool');
// smtpPool는 smtp서버를 사용하기 위한 모듈로
// transporter객체를 만드는 nodemailer의 createTransport메소드의 인자로 사용된다.

//gmail은 하루 500건까지 발송제한이 있다고 하는데, 500건 미만에서도 발송제한이걸리기도 하는 모양이다.
//또한 수상한 링크는 gmail에서 발송자체를 차단해버린다. 메일이 자꾸 반송되어온다면 링크를 삭제해야한다.

const config = {
  gmail: {
    service: '',
    user: '',
    password: '',
  },
};
//POP 서버명 : pop.naver.comSMTP 서버명 : smtp.naver.comPOP 포트 : 995, 보안연결(SSL) 필요SMTP 포트 : 465, 보안 연결(SSL) 필요아이디 : heejeong5525비밀번호 : 네이버 로그인 비밀번호
//mail.host = smtp.daum.net mail.port = 465 mail.protocol = smtps


const transporter = nodemailer.createTransport({
  service: config.gmail.service,
  auth: {
    user: config.gmail.user,
    pass: config.gmail.password,
  },
  // tls: {
  //   rejectUnauthorize: false,
  // },
  // maxConnections: 5,
  // maxMessages: 10,
})
// 본문에 html이나 text를 사용할 수 있다.
module.exports = function () {
  return {
    mailSend : function (to,subject,html,callback) {
      var from = config.gmail.user;
      var mailOptions = {
        from,
        to,
        subject,
        html,
        // text,
      };
      console.log("mail sender %j",mailOptions);
      setTimeout(function(){
      transporter.sendMail(mailOptions, (err, res) => {
        console.log("transporter.sendMail");
        if (err) {
          console.log('failed... => ', err);
          transporter.close();
          return callback(err);
        } else {
          console.log('succeed... => ', res);
          transporter.close();
          return callback(null,res);
        }
      });
       }, 10000);
    }
  }
}
