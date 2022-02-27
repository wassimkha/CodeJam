console.log("from the extension");
var apiKey;

function getSelectionText() {
    var text = "";
    var activeEl = document.activeElement;
    var activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
    if (
        (activeElTagName == "textarea") || (activeElTagName == "input" &&
            /^(?:text|search|password|tel|url)$/i.test(activeEl.type)) &&
        (typeof activeEl.selectionStart == "number")
    ) {
        text = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);
    } else if (window.getSelection) {
        text = window.getSelection().toString();
    }
    return text;
}
var selectedText = "";
var loading = false

// add event listener for when DOM loads.
document.addEventListener('DOMContentLoaded', fireContentLoadedEvent(), false);

function giveAnswer(question, pTag) {
    console.log("Finding answers for question 2: ", question)
    //if the question does not end with \n, add it
    var match = /\r|\n/.exec(question);
    if (!match) {
        question += "\n";
        question += "\n";
        console.log("adding space breaks");
    }
    var data = JSON.stringify({
        "prompt": "Q: " + question + "\nA:",
        "temperature": 0,
        "max_tokens": 1500,
        "top_p": 0.5,
        "frequency_penalty": 0,
        "presence_penalty": 0,
        "stop": [
            "\n"
        ]
    });

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = false;

    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
            var res = this.responseText;
            var obj = JSON.parse(res);
            console.log(obj, obj.choices)
            if (obj && obj.choices && obj.choices.length > 0) {
                var completion = obj.choices[0].text;
                loading = false;
                if (completion.length > 0) {
                    pTag.innerHTML = completion;

                    chrome.storage.local.get(['questionsAndAnswers'], function(result) {
                        questionsAndAnswers = result.questionsAndAnswers;

                        if(questionsAndAnswers){
                            questionsAndAnswers.push([question, completion]);

                            chrome.storage.local.set({questionsAndAnswers: questionsAndAnswers}, function() {
                                console.log('Value is set to ' + questionsAndAnswers);
                            });
                        }
                    });
                } else {
                    pTag.innerHTML = "No answer found";
                }
            }
        }
    });

    xhr.open("POST", "https://api.openai.com/v1/engines/text-davinci-001/completions");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", "Bearer " + apiKey);

    xhr.send(data);
    return "hello there";
}

function getDefinition(word, pTag) {
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = false;

    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
            var res = this.responseText;
            var obj = JSON.parse(res);
            console.log(obj, obj.length)
            if (obj && obj.length > 0) {
                obj = obj[0];
                var html = "";

                for (var i = 0; i < obj.meanings.length; i++) {
                    html += obj.meanings[i].partOfSpeech + "<br> <ul>";
                    for (var j = 0; j < Math.min(obj.meanings[i].definitions.length, 3); j++) {
                        html += "<li>" + obj.meanings[i].definitions[j].definition + "</li>";
                    }
                    html += "</ul>";
                }
                pTag.innerHTML = html;
            } else {
                pTag.innerHTML = "No definition found";
            }
        }
    });

    xhr.open("GET", "https://api.dictionaryapi.dev/api/v2/entries/en/" + word);

    xhr.send();
}

chrome.storage.local.get(['apiKey'], function(result) {
    apiKey = result.apiKey;
    console.log('Value currently is ' + apiKey);
});

function fireContentLoadedEvent (items) {
    var div = document.createElement('div');
    var h1 = document.createElement('h1');
    h1.innerHTML = "";
    h1.style.margin = "0px";
    h1.style.fontSize = "13px";
    div.appendChild(h1);
    var p = document.createElement('p');
    p.innerHTML = "";
    p.id = "answer_extension";
    p.style.margin = "5px";
    p.style.fontSize = "25px";
    div.appendChild(p);


    div.style.position = 'absolute';
    div.style.top = '0px';
    div.style.left = '0px';
    div.style.maxWidth = '400px';
    div.style.height = 'auto';
    div.style.padding = '15px';
    div.style.backgroundColor = '#59b371';
    div.style.zIndex = '9999';
    div.style.opacity = '0.9';
    div.style.borderRadius = '5px';
    div.style.pointerEvents = 'none';
    div.style.display = 'none';
    // add the hover element to the DOM
    document.body.appendChild(div);
    // add event listener for when the mouse moves
    document.addEventListener('mouseup', function callback(e) {
        // set the position of the hover element
        selectedText = window.getSelection().toString();
        var selectedTextWithoutSpaces = selectedText.trim();
        var spaceCount = (selectedTextWithoutSpaces.split(" ").length - 1);
        //show if selected text is longer than 3 charaters
        if (selectedText.length > 3 && selectedTextWithoutSpaces.endsWith("?")) {
            console.log("we got a question");
            h1.innerHTML = "Your Answer";
            div.style.top = e.pageY + 'px';
            div.style.left = e.pageX + 'px';
            p.style.fontSize = "25px";
            div.style.backgroundColor = '#59b371';
            div.style.display = 'block';
            p.innerHTML = "loading...";
            giveAnswer(selectedText, p);
        } else if (selectedTextWithoutSpaces.length >= 1 && spaceCount == 0) {
            console.log("got a single word");
            h1.innerHTML = "Your definition";
            div.style.top = e.pageY + 'px';
            div.style.left = e.pageX + 'px';
            p.style.fontSize = "15px";
            div.style.backgroundColor = '#82b5bd';
            div.style.display = 'block';
            //#82b5bd
            p.innerHTML = "loading...";
            getDefinition(selectedTextWithoutSpaces, p);

        } else {
            console.log("not a question")
            loading = false;
            div.style.display = 'none';
            p.innerHTML = "";
        }
    }, false);
}