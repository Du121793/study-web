const { type } = require('express/lib/response')
const mongoose = require('mongoose')
const { Schema } = mongoose

const userSchema = new Schema({
  lineID: {
    type: String,
    require: true,
  },

  userinfo: {
    username: {
      type: String,
    },
    realname: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    pictureUrl: {
      type: String,
    },
    grade: {
      type: String,
    },
  },
  courses: {
    type: [String],
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    default: 'student',
  },
  date: {
    type: Date,
    default: Date.now,
  },
})

userSchema.methods.isStudent = function () {
  return this.role == 'student'
}

userSchema.methods.usTeacher = function () {
  return this.role == 'teacher'
}

module.exports = mongoose.model('User', userSchema)
