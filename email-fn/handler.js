'use strict'

const fs = require('fs')
const nodemailer = require('nodemailer')
const formidable = require('formidable')
const fetch = require('node-fetch');

const secretKey = fs.readFileSync('/var/openfaas/secrets/secret-key', 'utf8');
const gmailEmail = fs.readFileSync('/var/openfaas/secrets/gmail', 'utf8');
const gmailPassword = fs.readFileSync('/var/openfaas/secrets/gmail-pass', 'utf8');
const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword
    }
})

let app
module.exports = async (config) => {
    if (!app) {
        app = config.app

    }
    app.post('/*', (req, res, next) => {
        const form = formidable({ multiples: true });

        form.parse(req, (err, fields, files) => {
            if (err) {
                next(err);
                return;
            }
            req.fields = fields
            handler(req, res).then()
        });
    });
}

const handler = async (req, response) => {
    console.log(req.fields)

    const remoteIpAddress = req.connection.remoteAddress
    const gReCaptcha = req.fields['g-recaptcha-response']
    const name = req.fields['name']
    const email = req.fields['email']
    const service = req.fields['service']
    const message = req.fields['message']

    const from = `${service} contact <${gmailEmail}>`
    const to = 'amir.gholzam@live.com'

    if (gReCaptcha === undefined || gReCaptcha === '' || gReCaptcha === null) {
        return response.json({ error: { code: 'ServerError/NullCaptchaValue', message: 'Please select captcha first' } })
    }
    const verificationURL = 'https://www.google.com/recaptcha/api/siteverify?secret=' + secretKey + '&response=' + gReCaptcha + '&remoteip=' + remoteIpAddress

    try {
        const resCap = await fetch(verificationURL, { method: 'POST' })
        const parsedRecap = resCap.json()

        if (parsedRecap.success !== undefined && !parsedRecap.success) {
            console.log('Captha/responseError', resCap)
            console.log('Captha/responseError', parsedRecap)
            return response.status(400).json({ error: { code: 'ServerError/ResponseCaptchaError', message: 'Failed captcha verification' } })
        }

    } catch (error) {
        console.log('[ERROR]{RECAPTCHA} - ', error)
        return response.status(400).json({ error: { code: 'ServerError/ResponseCaptchaError', message: 'Failed captcha verification' } })

    }

    const html = `
        <!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd">
<html>
  <head>
    <style>
      button:hover{opacity:0.7}
      a:hover{opacity:0.7}
    </style>
    
  </head>
  <body>
    <div class="card" style="box-shadow:0 4px 8px 0 rgba(0, 0, 0, 0.2);margin:auto;text-align:center;font-family:arial;">
      <h1>${service} service</h1>
      <p>Full name: ${name}</p>
      <p>Email: ${email}</p>
      <div style="margin: 24px 0;">
      </div>
      <p> ${message}</p>
      
    </div>
  </body>
</html>
              `
    const mailOptions = {
        from: from,
        to: to,
        subject: `Telar Contact - ${name}`,
        html: html
    }
    const result = await mailTransport.sendMail(mailOptions)



    response.redirect("https://telar.press/pending.html")
} 