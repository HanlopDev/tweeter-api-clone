const express = require('express')
const User = require('../models/user')
const multer = require('multer')
const sharp = require('sharp')
const auth = require('../middleware/auth')

const router = new express.Router();

//helpers 
const upload = multer({
    limits:{
        fileSize: 100000000
    }
})

//create a user
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try{
        await user.save()

        res.status(201).send(user)
    }

    catch(e){
        res.status(400).send(e)
    }
})


// get the users
router.get('/users', async (req, res) => {
    try{
        const users = await User.find({})
        res.send(users)
    }
    catch(e){
        res.status(500).send(e)
    }
})

//login user router
router.post('/users/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token})
    }
    catch(e){
        res.status(500).send(e)
    }
})

//delete user
router.delete('/users/:id', async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id)

    try{
        if(!user){
            return res.status(400).send()
        }
        res.send()
    }
    catch(e){
        res.status(500).send(e)
    }
})

//get user by Id
router.get('/users/:id', async (req, res) => {
    try{
        const user = await User.findById(req.params.id)

    if(!user){
        return res.status(404).send()
    }
    res.send(user)
    }
    catch(e){
        res.status(500).send(e)
    }
})

//post user image
router.post('/users/me/avatar',auth ,upload.single('avatar'), async (req, res) => {

    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()

    if(req.user.avatar != null) {
        req.user.avatar = null
        req.user.avatarExists = false
    }

    req.user.avatar = buffer
    req.user.avatarExists =  true
    await req.user.save()

    res.send(buffer)

}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})


//presenting users image
router.get('/users/:id/avatar', async (req, res) => {
    try{
        const user = await User.findById(req.params.id)

    if(!user || !user.avatar){
        throw new Error("User does not exist")
    }
    res.set('Content-Type', 'image/jpg')
    res.send(user.avatar)
    }

    catch(e){
        res.status(404).send(e)
    }
})

//create following
router.put('/users/:id/follow', auth,async (req, res) => {
    if(req.user.id != req.params.id){
        try{
            const user = await User.findById(req.params.id)
            if(!user.followers.includes(req.user.id)){
                await user.updateOne({ $push: { followers: req.user.id } })
                await req.user.updateOne({ $push: { following: req.params.id } })
                res.status(200).json("user has been followed")
            }
            else{
                res.status(403).json("you already follow this user")
            }
        }

        catch(e){
            res.status(500).json(e)
        }
    }
    else{
        res.status(403).json("You can not follow yourself")
    }
})

// unfollow user
router.put('/users/:id/unfollow',auth ,async (req, res) => {
    if(req.user.id != req.params.id){
        try{
            const user = await User.findById(req.params.id)

            if(user.followers.includes(req.user.id)){
                await user.updateOne({$pull: {followers: req.user.id}})
                await req.user.updateOne({$pull:{following: req.params.id}})
                res.status(200).json("user has been unfollowed")
            }
            else{
                res.status(403).json("You dont follow this user")
            }
        }
        catch(e){
            res.status(500).json(e)
        }
    }
    else{
        res.status(403).json("You cant unfollow yourself")
    }
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    console.log(updates)

    const allowedUpates = ['name', 'email', 'password', 'website', 'bio', 'location']
    const isValidOperation = updates.every((update) => allowedUpates.includes(update))

    if(!isValidOperation) {
        return res.status(400).send({
            error: "Invalid request"
        })
    }

    try{
        const user = req.user
        updates.forEach((update) => {user[update] = req.body[update]})
        await user.save()

        res.send(user)
    }
    catch(e){
        res.status(400).send(e)
    }
})

 module.exports = router