var left = document.querySelector('.left');
var out = document.getElementById('out');
var cursor = document.getElementById('cursor');
var input = document.getElementById('command');

var prompt = '$ ';
// whether there is an ongoing printing
var printing = false;

// delay between chars
var delay = 40;

// max command size
var maxCommandSize = 20;

var actions = ['dark', 'light', 'toggle', 'clear'];

window.init = function () {
  document.addEventListener('keydown', keyDownListener);

  // add listeners for links
  var links = document.querySelectorAll('.right li a');
  for (var i = 0; i < links.length; ++i) {
    links.item(i).addEventListener('click', processClick);
  }

  processCommand('ABOUT');
};

function keyDownListener (event) {
  event.preventDefault();
  var key = event.key;

  // if a printing is ongoing, ignore the input
  if (!printing) {
    if (key === 'Enter' ||
       input.textContent.length >= maxCommandSize) {
      // process the input
      var command = input.textContent;
      if (command.length) {
       input.textContent = '';
        processCommand(command);
      }
    } else if (key === 'Backspace') {
      input.textContent = input.textContent.substr(0, input.textContent.length - 1);
    } else {
      // if the pressed key is allowed, append to commandHolder
      if (key.length === 1 && ((
        key >= 'A' && key <= 'Z' ||
          key >= 'a' && key <= 'z' ||
          key === ' '))) {
        input.textContent += event.key.toUpperCase();
        }
    }
  }
}

function processCommand (command) {
  var span = document.createElement('span');
  span.textContent = command.toUpperCase();
  out.insertBefore(span, input);
  var br = document.createElement('br');
  out.insertBefore(br, input);

  command = command.trim().toLowerCase();
  // check for content block
  var content = document.querySelector('.content .' + command);
  if (content) {
    var text = prepareContentText(content);
    printText(text);
  } else if (actions.indexOf(command) !== -1) {
    // handle actions
    processAction(command);
  } else {
    printText('Unknown command: ' + command + "\n" + prompt);
  }
}

function processClick (event) {
  var command = event.target.getAttribute('data-command');

  if (!printing && command) {
    processCommand(command);
  }
}

function prepareContentText (section) {
  return section.textContent + prompt;
}

function printText (text) {
  var chars = text
        .replace("\r", '')
        .split('');
  var span = document.createElement('span');
  out.insertBefore(span, input);
  printing = true;
  printCharArray(chars, span, delay);
};

// prints the character array to the target element
function printCharArray (chars, target, timeout) {
  if (! (chars instanceof Array)) {
    return;
  }

  if (chars.length === 0) {
    // print completed
    rewriteElement(target);
    printing = false;
    return;
  }

  var char = chars.shift();

  if (char === "\n") {
    // insert a line break
    var br = document.createElement('br');
    var parent = target.parentNode;
    var sib = target.nextElementSibling;
    parent.insertBefore(br, sib);

    rewriteElement(target);

    // create a new span for new line
    var span = document.createElement('span');
    parent.insertBefore(span, sib);
    scrollToBottom();
    printCharArray(chars, span, timeout);
  } else {
    target.textContent += char;

    setTimeout(function () {
      printCharArray(chars, target, timeout);
    }, timeout);
  }
};

function rewriteElement (element) {
  element.innerHTML = element.textContent.replace(/&lt;(.*?)&gt;/g, function (match, tag) {
    return '<' + tag + '>';
  });
};

function processAction (action) {
  switch (action) {
  case 'toggle':
    action = document.body.className == 'dark' ? 'light' : 'dark';
  case 'dark':
  case 'light':
    changeTheme(action);
    break;
  case 'clear':
    clearOutput();
    break;
  }
  printText("\n" + prompt);
}

function changeTheme(theme) {
  if (document.body.className !== theme) {
    document.body.className = theme;
  }
}

function clearOutput () {
  out.removeChild(cursor);
  out.removeChild(input);
  out.textContent = '';

  var span = document.createElement('span');
  out.appendChild(span);
  out.appendChild(input);
  out.appendChild(cursor);
}

function scrollToBottom () {
  left.scrollTop = left.scrollHeight - left.offsetHeight;
}
