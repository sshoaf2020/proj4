let strengthLabels = [
	"Very Weak",
	"Weak",
	"Fair",
	"Strong",
	"Very Strong"
];

let usernameExists = false;

let setUsernameStatus = (exists) => {
	if (!exists) {
		usernameExists = false;
		document.getElementById('usernameStatus').innerHTML = "done";
	} else {
		usernameExists = true;
		document.getElementById('usernameStatus').innerHTML = "error";
	}
}

let usernameCheck = (username) => {
	//when the button calls this it passes in an event object
	//when the validation code calls this we get a value (String)
	if (typeof username === "object") {
		username = document.getElementById("username").value;
	}

	//make a GET request to users/<username>,
	//accept a valid status of 200 or 404, anything else will throw a console error
	//we are not registering an error handler so errors should bubble up to top of app
	//TODO
	axios.get('users/' + username)
		.then(function (response) {
			usernameExists = true;
			document.getElementById('usernameStatus').innerHTML = 'error';
		}).catch(function (error) {
			usernameExists = false;
			document.getElementById('usernameStatus').innerHTML = 'done';
		});
};

let strengthCheck = (password) => {
	let msg = document.getElementById('passwordmessage');

	//when the button calls this it passes in an event object
	//when the validation code calls this we get a value (String)
	if (typeof password === "object") {
		password = document.getElementById("password").value;
	}

	if (password === "") {
		msg.innerHTML = ' ';
		return;
	}

	//Calculate the strength of the password.
	//and update the message in the passwordmessage
	//return the numeric score from zxcvbn
	//TODO
	let calculated_strength = zxcvbn(password);
	msg.innerHTML = strengthLabels[calculated_strength.score];
	console.log(calculated_strength.score);
	return calculated_strength.score;
};


let showError = (error) => {
	let errorNode = document.getElementById("error");
	if (error === "") {
		//clear error
		console.log('clearing error');
		errorNode.style.display = "none";
		errorNode.innerHTML = "<p></p>";
	} else {
		//set error
		console.log('setting error "' + error + '"');
		errorNode.style.display = "block";
		errorNode.innerHTML = "<p>" + error + "</p>";
		errorNode.focus();
	}
};

//these are functions returning functions
//config settings get passed into the outter function
//and the value to test against is passed into the inner function
//they use a scope closure to hold onto the config settings
//because the inner function was created in a scope where 'message' exists, for example
//passing a test returns true, failing a test returns a message
let minLength = (length, message) =>
	(value) => value.length > length ? true : message;
//TODO: maxLength   STEVEN:(NOT SURE IF THIS WAS DONE RIGHT)
let maxLength = (length, message) =>
	(value) => value.length < length ? true : message;


let regex = (regex, message) =>
	(value) => regex.test(value) ? true : message;

let strength = (strength, message) =>
	(value) => strengthCheck(value) >= strength ? true : message;

let confirmed = (message) =>
	(value) => value === document.getElementById('confirm_password').value ? true : message;

let available = (message) =>
	() => !usernameExists ? true : message;


//now we compose the above validation building blocks
//into something thats easy to read and adjust
//each top level key is a domNode id, like username, and points to an array,
//each array contains function pointers
//each function pointer is a closure'd inner-function from above
//and accepts a value to test against
let validation = {
	username: [ //the array of tests to run against usernames
		minLength(3, "Username too short"),
		maxLength(10, "Username too long"),
		regex(/^[0-9a-zA-Z]+$/, "Username can only be letters and numbers"),
		available("Username exists")
	],
	password: [
		minLength(1, "Password too short"),
		confirmed("Passwords must match"),
		strength(2, "Password not strong enough")
	],
	name: [
		minLength(1, "Name too short"),
	]
};

//given a dom element id, run each appropriate validation tests
//against the value contained in the element id
//if any test returns something other than true(boolean) 
//stop testing and return the error message that the test returned
//STEVEN: should be right
let validate = (id) => {
	let form = document.getElementById(id);
	for (let i = 0; i < validation[id].length; i++) {
		let result = validation[id][i](form.value);
		if (result === true) {
			//do nothing
		} else {
			return result;
		}
	}
	return true;
}

let submitForm = function (e) {
	let ids = ['username', 'password', 'name'];

	for (let i = 0; i < ids.length; i++) {
		let id = ids[i];
		let result = validate(id);
		if (result !== true) {
			showError(result);

			//stop form from doing it's action
			e.preventDefault();
			return false;
		}
	}
	return true;
};

window.addEventListener("load", function () {
	//listen for all types of changes to password field
	//so we can update the strength
	let passwordNode = document.getElementById('password');
	passwordNode.addEventListener('keydown', strengthCheck);
	passwordNode.addEventListener('keyup', strengthCheck);
	passwordNode.addEventListener('cut', strengthCheck);
	passwordNode.addEventListener('paste', strengthCheck);
	passwordNode.addEventListener('blur', strengthCheck);

	//listen for all types of changes to username field
	//so we can update the icon and exists boolean
	let usernameNode = document.getElementById('username');
	usernameNode.addEventListener('keydown', usernameCheck);
	usernameNode.addEventListener('keyup', usernameCheck);
	usernameNode.addEventListener('cut', usernameCheck);
	usernameNode.addEventListener('paste', usernameCheck);
	usernameNode.addEventListener('blur', usernameCheck);

	//register submit handler
	let formNode = document.getElementById('form');
	formNode.addEventListener('submit', submitForm);

	//grab any error messages returned by php in the # field
	let errorMessage = window.location.hash;
	window.location.hash = "";
	console.log('error message is' + errorMessage);

	//if an error from php exists, show it
	if (errorMessage && errorMessage.length > 0) {
		errorMessage = decodeURIComponent(errorMessage).slice(1);
		showError(errorMessage);
	}
});