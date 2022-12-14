const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

//Validator
var validator = require('validator');

//Send Grid api for sending email
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('');

//User model
const User = require('../models/User');

router.get('/',(req,res) => res.redirect('/users/login'))

//LOgin page
router.get('/login',(req, res)=> res.render('login'));

// Register page
router.get('/register',(req,res)=>res.render('register'));

// Register handel post request
router.post('/register',(req,res)=> {
    const { name, email, password, password2 }=req.body;
    let errors = [];

    //check required fields
    if(!name || !email || !password || !password2)
    {
        errors.push({msg:"Please fill in all fields"});
    }

    //Check password match
    if(password != password2)
    {
        errors.push({msg:"Passwords do not match"});
    }

    //Check min length of password
    if(password.length < 6){
        errors.push({msg:"Password should be atleast 6 characters"});
    }

    if(!validator.isEmail(email))
    {
        errors.push({msg:"Email Address is invalid"});
    }

    if(errors.length > 0){
        res.render('register', {
            errors,
            name,
            email,
            password,
            password2
        })
    }
    else{
        // Validation Passed
        User.findOne({email: email})
        .then(user => {
            if(user){
                //User already exists
                errors.push({msg:'Email is already registered'});
                res.render('register', {
                    errors,
                    name,
                    email,
                    password,
                    password2
                });
            } else {
                const newUser = new User({
                    name,
                    email,
                    password
                });

                //Hash password
                bcrypt.genSalt(8, (err, salt)=>{
                    bcrypt.hash(newUser.password, salt, (err, hash)=>{
                        if(err) throw err;

                        //Set password to hashed
                        newUser.password = hash;

                        //Save the user in data base
                        newUser.save()
                        .then(user => {

                            //Sengrid sending email
                            const msg = {
                                to: newUser.email,
                                from: 'aditya99prakash@gmail.com',
                                subject: 'Welcome to FoodCloud',
                             //   text: 'Hello! ' + newUser.name +' ! You have successfully registered. Enjoy dining.',
                                html: '<strong>'+ 'Hello! ' + newUser.name +' ! You have successfully registered. Enjoy dining.' +'</strong>'
                              };
                              sgMail.send(msg);

                            //Flash message for successful login
                            req.flash('success_msg', 'You are now registered and can Login');
                            res.redirect('/users/login');
                        })
                        .catch(err => console.log(err));
                    })
                })
            }
        });
    }
});

// Login Handle
router.post('/login', (req, res, next)=>{
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash : true
    })(req, res, next);
});

// Logout Handle
router.get('/logout', (req, res) => {
    req.logOut();
    req.flash('success_msg', 'You are successfully logged out');
    res.redirect('/users/login');
})



module.exports = router;