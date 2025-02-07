const router = require('express').Router()
const passport = require('passport')
require('../config/passport')
const User = require('../models').user
const jwt = require('jsonwebtoken')

router.get(
  '/line',
  passport.authenticate('line', {
    scope: ['profile', 'openid', 'email'],
    prompt: 'select_account',
  })
)

router.get('/successful', passport.authenticate('line', { failureRedirect: '/' }), (req, res) => {
  const tokenObject = {
    userID: req.user._id,
  }
  const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET)
  res.redirect(301, `http://localhost:3000/methods/service/Res?token=${token}`)
})

module.exports = router
