const mongoose = require('mongoose')


const notificationSchemas = new mongoose.Schema({
    username: {
        type: String,
        require: true
    },
    notSenderId: {
        type: mongoose.Schema.Types.ObjectId,
        require: true,
        ref: 'User'
    },
    notReceiverId: {
        type: mongoose.Schema.Types.ObjectId,
        require: true,
        ref: 'User'
    },
    notificationType: {
        type: String,
    },
    postText: {
        type: String,
    }

})

const Notification = mongoose.model('Notification', notificationSchemas)
module.exports = Notification
