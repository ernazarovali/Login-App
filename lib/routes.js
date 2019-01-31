var express = require('express');
var app = express();
var passport = require('passport');
require('dotenv').config();

const { Pool, Client } = require('pg');
const bcrypt= require('bcryptjs');

//TODO
//Add forgot password functionality
//Add email confirmation functionality
//Add edit account page
//ifAuthenticated - is that all it needs to be logged in. Or do we need to write logic on app.post('login')?

app.use(express.static('public'));

const LocalStrategy = require('passport-local').Strategy;
//const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: process.env.PGPORT
});

module.exports = function (app) {

	
	app.get('/', async function (req, res, next) {
		const client = await pool.connect()
		res.render('index', {
			title: "Home", 
			userData: req.body.firstname, 
			messages: {
				danger: req.flash('danger'), 
				warning: req.flash('warning'), 
				success: req.flash('success')
			}
		});
	});

	//REGISTRATION
	
	app.get('/join', async function (req, res, next) {
		const client = await pool.connect()
		res.render('join', {
			title: "Join", 
			userData: req.body.firstname, 
			messages: {
				danger: req.flash('danger'), 
				warning: req.flash('warning'), 
				success: req.flash('success')
			}
		});
		console.log(req.body.firstname);
	});
	
	
	app.post('/join', async function (req, res) {
		
		try{
			const client = await pool.connect()
			await client.query('BEGIN')
			var pwd = await bcrypt.hash(req.body.userpassword, 5);
			await JSON.stringify(client.query('SELECT username FROM "users" WHERE "useremail"=$1', 
				[req.body.useremail], function(err, result) {
				if(result.rows[0]){
					req.flash('warning', "This Username is already registered");
					res.redirect('/join');
				}
				else{
					client.query('INSERT INTO users (firstname, lastname, username, useremail, userpassword) VALUES ($1, $2, $3, $4, $5)', [req.body.firstname, req.body.lastname, req.body.username, req.body.useremail, pwd], function(err, result) {
						if(err){
							console.log(err);
						}
						else {
							client.query('COMMIT')
								console.log(result)
								req.flash('success','User created')
								res.redirect('/account');
								return;
							}
						});
					}
				}));
			client.release();
		} 
		catch(e){throw(e)}
	});

	//ACCOUNT
	
	app.get('/account', async function (req, res, next) {

		const client = await pool.connect()

			res.render('account', {
				title: "Account", 
				userData: req.body.firstname, 
				messages: {
					danger: req.flash('danger'), 
					warning: req.flash('warning'), 
					success: req.flash('success')
				}
			});
		console.log(req.body.firstname);
	});

	//LOGIN

	app.get('/login', checkAuthentication, function (req, res, next) {
		//do something if the user is Authenticated
		res.redirect('/account');
	});
	function checkAuthentication(req, res, next){
		if (req.isAuthenticated()) {
			next();
		}
		else{
			res.redirect('/login')
		}
	};

	app.post('/login',	passport.authenticate('local', {
		successRedirect: '/account',
		failureRedirect: '/logins',
		failureFlash: true
		}), function(req, res) {
			if (req.body.remember) {
				req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
			} 
			else {
				req.session.cookie.expires = false; // Cookie expires at end of session
		}
		res.redirect('/');
	});
	
	//LOGOUT

	app.get('/logout', function(req, res){
		
		console.log(req.isAuthenticated());
		req.logout();
		console.log(req.isAuthenticated());
		req.flash('success', "Logged out. See you soon!");
		res.redirect('/');
	});
}
	

passport.use('local', new LocalStrategy({passReqToCallback : true}, (req, username, password, done) => {
	console.log('username');
	console.log('password');
	return done(null, 'asdasd');

	// loginAttempt();
	// async function loginAttempt() {
		
	// 	const client = await pool.connect()
	// 	try{
	// 		await client.query('BEGIN')
	// 		var currentAccountsData = await JSON.stringify(client.query('SELECT id, firstname, username, userpassword FROM "users" WHERE "username"=$1', [username], function(err, result) {
				
	// 			if(err) {
	// 				return done(err)
	// 			}	
	// 			if(result.rows[0] == null){
	// 				req.flash('danger', "Oops. Incorrect login details.");
	// 				return done(null, false);
	// 			}
	// 			else{
	// 				bcrypt.compare(password, result.rows[0].userpassword, function(err, check) {
	// 					if (err){
	// 						console.log('Error while checking password');
	// 						return done();
	// 					}
	// 					else if (check){
	// 						return done(null, [{username: result.rows[0].username, 
	// 							firstname: result.rows[0].firstname}]);
	// 					}
	// 					else{
	// 						req.flash('danger', "Oops. Incorrect login details.");
	// 						return done(null, false);
	// 					}
	// 				});
	// 			}
	// 		}))
	// 	}
		
	// 	catch(e){throw (e);}
	// };
}
));


passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(user, done) {

	done(null, user);
});