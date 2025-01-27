const router = require('express').Router()
// const registerValidation = require("../validation").registerValidation;
// const loginValidation = require("../validation").loginValidation;
const passport = require('passport')
require('../config/passport')
// require("./config/passport")(passport);
const User = require('../models').user
const jwt = require('jsonwebtoken')

router.get(
  '/line',
  passport.authenticate('line', {
    scope: ['profile', 'openid', 'email'],
    prompt: 'select_account',
  })
)

<<<<<<< HEAD
router.get(
  "/successful",
  passport.authenticate("line", { failureRedirect: "/" }),
  (req, res) => {
    const tokenObject = {
      userID: req.user._id,
    };
    const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);

    res.redirect(301, `http://localhost:3000/?token=${token}`);
    res.send({ token: "JWT " + token });
=======
router.get('/successful', passport.authenticate('line', { failureRedirect: '/' }), (req, res) => {
  const tokenObject = {
    userID: req.user._id,
>>>>>>> 838d7cc7fe7a1adf456cf6d526e10c1e5696efdd
  }
  const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET)
  // ?token=${token}
  res.redirect(301, `http://localhost:3000/apis/Res?token=${token}`)
})

module.exports = router
