

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




}