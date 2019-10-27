//load the filesystem core nodejs package so we can read and write to the FS
const fs = require('fs');
//load in the express and express-session packages
const express = require('express')
const session = require('express-session')

//get the bodyparser middleware package
const bodyparser = require('body-parser')

//call express to get an app object, to be used like in php/slim
const app = express()

//setup the port we want to use
const port = 3000
//setup the filepath to read and write DB to
const dbFilePath = 'db/database.json'

//lets load our database into memory
let db;
try{
	let rawdata = fs.readFileSync(dbFilePath);  
	db = JSON.parse(rawdata);
}catch (e){
	//cant read file, make a blank db to use
	db = {};
}
console.log("DB",JSON.stringify(db));

//define some helper functions
let writeDB = () => {
	let str = JSON.stringify(db);
	//using sync so we can be sure its written to disk when the function ends
	fs.writeFileSync(dbFilePath, str);
}
let getUser = (username) =>{
	if(db[username]){
		return db[username];
	}
	return false;
}
let saveUser = (userObj) =>{
	let username = userObj.username;
	if(db[username]){
		return false;
	}
	db[username] = userObj;
	writeDB();
	return true;
}
let authUser = (username, password) => {
	if(db[username].password === password){
		return true;
	}
	return false;
}

//setup session
//its always on, no need to session_start
app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true
}))

// to support URL-encoded bodies like what our forms will Post us
app.use(bodyparser.urlencoded({extended: true})); 

//register a listener for GET requests to / and return 'Hello World' as our response
app.get('/', (req, res) => {
	return res.send('Hello World!')
})


app.get('/users/:username', (req,res)=>{
	console.log("get /users/:username");
	//TODO
	//given a username, return a status 200 if it exists
	if(db[req.params.username]) {
		res.status(200).send('Username exists.');
	}
	//and return a 404 if it does not exist.
	else {
		res.status(404).send('Error, username does not exist.');
	}
});

let containsInvalidChars = function(string) {
	return /[^\d \w]/.test(string);
}

const crypto = require('crypto');

//from crypto documentation
let sha256 = function(password, salt) {
    let hash = crypto.createHmac('sha256', salt.toString()).update(password.toString()).digest('hex');
    return hash;
};

app.post('/users', (req,res)=>{
	console.log("post /users")
	//TODO
	//given a username, name and password as post variables
	//validate that username, name and password are longer than 3
	//and shorter than 50
	if(	undefined === req.body.username ||
		undefined === req.body.name ||
		undefined === req.body.password ||
		req.body.username === null || 	
		req.body.username.length <= 3 || 
		req.body.username.length >=50 ||
		req.body.name === null ||
		req.body.name.length <= 3 ||
		req.body.name.length >=50 ||
		req.body.password === null ||
		req.body.password.length <= 3 ||
		req.body.password.length >=50) {
			res.status(302).redirect('registration.html#' + encodeURIComponent('Error, parameter was of an invalid length.'));
	}
	//further validate the username and name that they only contain 
	//letters, numbers and spaces
	if(containsInvalidChars(req.body.username) || containsInvalidChars(req.body.name)) {
		res.status(302).redirect('registration.html#' + encodeURIComponent('Error, parameter contained invalid characters.'));
	}
	//hash the password using todays date and time as a salt.
	//store the salt and the resulting hash, but not the password
	let user = {username: req.body.username, name: req.body.name, password: req.body.password, date: Date.now().toString()};
	user.password = sha256(user.password, user.date);
	saveUser(user);
	//return a 302 -> login.html on success
	//return a 302 -> registration.html#errorMessage on error
	//you must urlencode the errorMessage
	res.status(302).redirect('login.html');
});

app.post('/auth',(req,res)=>{
	console.log('post /auth')
	//TODO
	//given a username and password
	//validate that the username exists
	if(getUser(req.body.username) === false) {
		res.status(302).redirect('login.html#' + encodeURIComponent('Error, username does not exist.'));
	}
	//hash the submitted password using 
	//the date stored on the users object
	//and compare the resulting hash to the stored hash
	let user = getUser(req.body.username);
	if(user !== null && user.password === sha256(req.body.password, user.date)){
		//if it passes, save the user's name into the session
		req.session.name = user.name;
		//and redirect 302 to index.html 
		res.status(302).redirect('index.html');
		//(which should be able to read the name from session)
	}
	else {
		//if it doesn't work return a 302 -> login.html#errorMessage
		//you must urlencode the errorMessage
		res.status(302).redirect('login.html#' + encodeURIComponent('Error, password did not match.'));
	}
})

app.get('/index.html',(req,res)=>{
	let hello = '';
	if(req.session && req.session.name){
		hello = "Hi "+req.session.name+"!"
	}
	let page = `
	<!DOCTYPE html>
	<title>Project 3</title>
	<h1>Project 3</h1>
	<section>
		<p>
		${hello}
		Go <a href="static/login.html">here to login</a> or <a href="static/registration.html">here to register</a>.
		</p>
	</section>`
	res.send(page)
})

//we're telling express to try to match file in our static directory.
//so if a request comes in for /registration.html
//it will first look in try to match one of our above defined routes
//and if it doesnt match a route it will look for proj4/static/registration.html
//if this app.use line were at the top, then our files in static would take precidence
app.use(express.static('static'))

//done with startup and registering callbacks
//all we have left to do is listen on the port 
//and if we were able to grab the port
//run our callback that console logs the achievement
app.listen(port, () => console.log(`Project 4 listening on port ${port}!`))
