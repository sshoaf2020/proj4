let showError = (error) => {
	let errorNode = document.getElementById("error");
	if(error === ""){
		//clear error
		console.log('clearing error');
		errorNode.style.display="none";
		errorNode.innerHTML = "<p></p>";
	}else{
		//set error
		console.log('setting error "'+error+'"');
		errorNode.style.display="block";
		errorNode.innerHTML = "<p>"+error+"</p>";
		errorNode.focus();
	}
};


window.addEventListener("load",function(){
	let errorMessage = window.location.hash;
	window.location.hash = "";
	console.log('error message is'+errorMessage);

	if(errorMessage && errorMessage.length > 0){
		errorMessage = decodeURIComponent(errorMessage).slice(1);
		showError(errorMessage);
	}
});