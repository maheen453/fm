import express from 'express';
import { pool } from "./dbConfig.js";

const app = express()

import bcrypt from 'bcrypt';
import session from 'express-session';
import flash from 'express-flash';
import passport from 'passport';
import initializePassport from './passportConfig.js';

initializePassport(passport);

const PORT = process.env.PORT || 4001;
app.use(express.static('public'));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended:false }));
app.use(
    session({
    secret: 'secret', 
    resave: false,
    saveUninitialized: false
})
);

app.use(passport.session());

app.use(passport.initialize());

app.use(flash());

app.get('/', (req,res) => {
    res.render("index");
});

app.get('/users/register', checkAuthenticated, (req,res) => {
    res.render("register");
});

app.get('/users/login', checkAuthenticated, (req,res) => {
    res.render("login");
});

app.get('/users/dashboard', checkNotAuthenticated, (req,res) => {
    res.render("dashboard", { user: req.user.uname });
});

app.get('/users/logout', (req,res) => {
    req.logOut(function(err) {
        if (err) { return next(err); }
        req.flash("success_msg", "You have successfully logged out.");
        res.redirect("/users/login");
    });
});

app.post('/users/register', async(req,res) => {
    let { name, email, password, password2 } = req.body;

    console.log({
        name,
        email,
        password,
        password2
    });

    let errors = [];

    if (!name || !email || !password || !password2) {
        errors.push({ message: "Please complete all fields" });
    }

    if (password.length < 6) {
        errors.push({ message: "Password should be at least 6 characters long"});
    }

    if (password != password2) {
        errors.push({ message: "Passwords do not match"});
    }

    if (errors.length > 0) {
        res.render('register', { errors });
    }

    else {
        //form validation done
        let hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);

        pool.query(
            `SELECT * FROM users WHERE email = $1`, [email], (err, results) => {
                if (err) {
                    throw err;
                }

                console.log(results.rows);

                if(results.rows.length > 0){
                    errors.push({ message: "Email already registered" });
                    res.render('register', { errors });
                }
                else {
                    pool.query(
                        `INSERT INTO users (uname, email, upassword)
                        VALUES ($1, $2, $3)
                        RETURNING id, upassword`, [name, email, hashedPassword],
                        (err, results)=>{
                            if (err) {
                                throw err;
                            }
                            console.log(results.rows);
                            req.flash('success_msg', "You are now registered. Please login");
                            res.redirect('/users/login');
                        }
                    )
                }

            }
        );
    }
});

app.post(
    '/users/login',
    passport.authenticate('local', {
        successRedirect: '/users/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })
);

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/users/dashboard');
    }
    next();
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
       return next();
    }
    res.redirect('/users/login');
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

