
const userRoute = require('./route/userRoute')
const adminRoute = require('./route/adminRoute')
const session = require('express-session')
const path=require('path')
const mongoose = require("mongoose")
const nocache = require('nocache')
const express = require('express')
const otpGenerator = require('otp-generator');
const bodyParser = require('body-parser');
const app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/static',express.static(path.join(__dirname,'public')))
app.use('/static',express.static(path.join(__dirname,'images')))
app.use(express.static(path.join(__dirname, './admin')));
app.set('view engine', 'ejs')
app.use(express.json());
app.use(nocache())
app.use(express.urlencoded({ extended: true }))
app.use(session({
    secret:"asdfghjkloiuyyjdsh",
    resave:false,
    saveUninitialized:true
}))

app.use('/',userRoute)
app.use('/admin',adminRoute)

mongoose
    .connect('mongodb+srv://mohdshahidv1221:Shahid1744@cluster0.qk5xatw.mongodb.net/Empirefurni?retryWrites=true&w=majority')
    .then(() => console.log('DB Connected'))
    .catch(err => console.log(err))


app.listen(3000,function(){
    console.log("server runnng");
})