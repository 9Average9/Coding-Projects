

function appendToInput(input) {
  let userInput = document.getElementById('input');
  userInput.value += input;
}

function clearInput(){
  let userInput = document.getElementById('input');
  userInput.value = '';
}

function calculate(){
  let userInput = document.getElementById('input');
  let input = userInput.value.trim();
  var checkInput = /^[0-9]+([+\-*/][0-9]+)?$/;


if(checkInput.test(input)){
  let result = eval(input);
userInput.value = result;
try{
if(result != undefined && isFinite(result)){
userInput = result;
}


}catch(error){
input = 'enter a valid expression'
}

}else{
  userInput.value = 'enter a valid expression';
}

}