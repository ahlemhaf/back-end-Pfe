const User = require('../../Models/UserModel')
const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const Token = require('../../Models/token')
const randomString = require('randomstring')
/**
 
 */
exports.register = async (req, res) => {
  try {
    const Found = await User.findOne({ email: req.body.email })
    if (Found !== null) {
      res.status(400).send('email is used !');
    }
    else {
      const salt = bcrypt.genSaltSync(10);
      req.body.passwordHashed = bcrypt.hashSync(req.body.password, salt);
      await User.create(req.body)
      let transporter = nodemailer.createTransport({
        host: process.env.host,
        port: process.env.port,
        secure: false,
        auth: {
          user: process.env.email,
          pass: process.env.password,
        },
      });
      await transporter.sendMail({
        from: `${process.env.email}`,
        to: `${req.body.email}`,
        subject: "Inscription",
        // attachments: [
        //   {
        //     path: path.resolve('./welcome.png')
        //   }
        // ],
        html: `<h1>Thanks For Joining Us!</h1> 
        <p> Hello  ${req.body.firstName} ${req.body.lastName},you are now a member in our <br><br>
         E-learning platform ,we are proud to have you among <br><br>
         us ,thanks again for your trust!</p>

         You can now join the platform :<br><br>

         Your email: ${req.body.email}<br>
         Your password :${req.body.password}<br>
   Dont't hesitate to contact us if needed.<br>
         Sincerely .<br>
         Hafsoni Ahlem<br>
         Manager of Academia .
        
        `
      })
      res.status(201).send({ message: 'registered successfully' })
    }
  } catch (error) {
    res.status(500).send({ message:error.message || "An error occured" });
  }

}

/**
 


 */
exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email })
    if (user != null && (await bcrypt.compare(req.body.password,user.passwordHashed))) {
      const data = {
        useremail:user.email,
        userId:user._id
      }
      var token = jwt.sign(data, process.env.JWT_SECRET, { expiresIn: '1d' });
      res.status(200).send({ message: 'connected successfully !', token: token })
    }
    else {
      res.status(400).send(' verify your email address and your password please!')
    }
  }
  catch (error) {
    res.status(500).send({ message:error.message || "An error occured" });
  }
}

exports.forgetpassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email })
    console.log(user);
    if (user) {
      const resetToken = randomString.generate(20);
      const reset = { 
        userId: user._id,
        token: resetToken
      }
      await Token.create(reset)
      const link = `${process.env.protocol}resetPassword/${resetToken}`

      let transporter = nodemailer.createTransport({
        host: process.env.host,
        port: process.env.port,
        secure: false,
        auth: {
          user: process.env.email,
          pass: process.env.password,
        },
      });

      await transporter.sendMail({
        from: `${process.env.email}`,
        to: `${req.body.email}`,
        subject: "Reset your password",

        html: `<h1>reset your password </h1> 
      <p> Bonjour  ${req.body.firsName} ${req.body.lastName},this's the link to reset your password! </p> <br>
       <a href="${link}">reset link</a>
      `
      })
      res.send({ message: 'link sent successfully' })

    } else {
      res.send(`user not found!`)
    }

  } catch (error) {
    res.status(500).send({ message: error.message || "An error occured" });
  }
}

/**
 * 
 * 
 */
exports.resetPassword = async (req, res) => {
  try {
    const token = await Token.findOne({ token: req.params.token })
    console.log(token.userId);
    if (token) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(req.body.password, salt);
      await User.findByIdAndUpdate(token.userId, { password: req.body.password, passwordHashed: hash }, { new: true })
      res.send({ message: 'password updated' })
    } else {
      res.status(400).send({ message: 'token invalid' })
    }
  } catch (error) {
    res.status(500).send({ message: error.message || "An error occured" });
  }
}


