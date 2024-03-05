const express = require('express')
require('./db/mongoose')

const app = express();
const userRouter = require('./router/user')
const tweetRouter = require('./router/tweet')

app.use(express.json())
app.use(userRouter)
app.use(tweetRouter)

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log('Server is up on the port: ' + port);
})