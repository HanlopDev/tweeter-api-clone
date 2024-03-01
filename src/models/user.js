const mongoose = require('mongoose')
const validator  = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Invalid Email')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 7,
        trim: true,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('Password cant contain "password"')
            }
        }
    },
    tokens:[{
        token:{
            type: String,
            require: true
        }
    }],

    avatar: {
        type: Buffer,
    },
    avatorExist: {
        type: Boolean
    },
    bio:{
        type: String
    },
    website:{
        type: String
    },
    location:{
        type:String
        },
    followers:{
        type: Array,
        detail: []
    },
    following:{
        type: Array,
        detail: []
    }

})

//create token
userSchema.methods.generateAuthToken = async function(){
    const user = this
    const token = jwt.sign({_id: user._id.toString()}, 'twittercloneAPI')

    user.tokens = user.tokens.concat({token})
    await user.save()

    return token
}

//relationship between user and tweet
userSchema.virtual('tweets', {
    ref: 'Tweet',
    localField: '_id',
    foreignField: 'user'
})

//delete password prior to get
userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password

    return userObject
}

// to hash the password 
userSchema.pre('save', async function(next) {
    const user = this

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

//authentication check
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email})
    if(!user){
        throw new Error('email does not exist')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch){
        throw new Error('Incorect password')
    }

    return user
}

const User = mongoose.model('User', userSchema)

module.exports = User

