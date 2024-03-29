const express = require('express')
const Tweet = require('../models/tweet')
const multer = require('multer')
const sharp = require('sharp')

//new router
const router = new express.Router();

const auth = require('../middleware/auth');

//helper finction
const upload = multer({
    limits:{
        fileSize: 100000000
    }
})

router.post('/tweets', auth,async (req, res) => {
    const tweet = new Tweet({
        ...req.body,
        user: req.user._id
    })

    try{
        await tweet.save()
        res.status(201).send(tweet)
    }

    catch(e){
        res.status(400).send(e)
    }
})

//Add image to the tweet router
router.post('/uploadTweetImage/:id', auth, upload.single('upload'),async (req, res) => {
    const tweet = await Tweet.findOne({_id: req.params.id})
    console.log(tweet)

    if(!tweet){
        throw new Error('Can not find the tweet')
    }

    const buffer = await sharp(req.file.buffer).resize({width: 350, height: 350}).png().toBuffer()
    tweet.image = buffer
    await tweet.save()
    res.send()
}, (error, req, res, next)=>{
    res.status(400).send({error: error.message})
})


//fetch all tweets
router.get('/tweets', async (req, res) => {
    try{
        const tweet = await Tweet.find({})
        res.send(tweet)
    }

    catch(e){
        res.status(500).send(e)
    }
})

//fetch a specific user tweet
router.get('/tweets/:id', async (req, res) => {
    const _id = req.params.id

    try{
        const tweet = await Tweet.find({ user: _id })

        if(!tweet){
            return res.status(404).send()
        }

        res.send(tweet)
    }

    catch(e){
        res.status(500).send(e)
    }
})

//fetch tweet image 
router.get('/tweets/:id/image', async (req, res) => {

    try{
        const tweet = await Tweet.findById(req.params.id)
        if(!tweet && !tweet.image){
            throw Error('Tweet does not exist')
        }
        res.set('Content-Type', 'image/jpg')
        res.send(tweet.image)
    }

    catch(e){
        res.status(404).send(e)
    }

})

//like tweet function
router.put('/tweets/:id/like', auth, async (req, res) => {

    try{
        const tweet = await Tweet.findById(req.params.id)
        if(!tweet.likes.includes(req.user.id)){
            await tweet.updateOne({$push: {likes: req.user.id}})
            res.status(200).json('post has been liked')
        }
        else{
            res.status(403).json("you already liked this tweet")
        }
    }

    catch(e){
        res.send(500).send(e)
    }
})

//unlike tweet
router.put('/tweets/:id/unlike', auth, async (req, res) => {

    try{
        const tweet = await Tweet.findById(req.params.id)
        if(tweet.likes.includes(req.user.id)){
            await tweet.updateOne({$pull: {likes: req.user.id}})
            res.status(200).json('post has been unliked')
        }
        else{
            res.status(403).json('You already unlike this tweet')
        }
    }

    catch(e){
        res.status(500).send(e)
    }
})

module.exports = router