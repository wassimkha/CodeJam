// timer variables
const time = 1700;
var timer;
var typetimer;
var apiKey;
var btnHistory = document.getElementById("showHistory");
var modalHistory = document.getElementById("historyModal");
var btnSettings = document.getElementById("showSettings");
var modalSettings = document.getElementById("settingsModal");
var btnHelp = document.getElementById("showHelp");
var modalHelp = document.getElementById("helpModal");
//Stores history
var questionsAndAnswers = [];
var sizeHist = 3;

function giveAnswer(question) {
    question = question.trim();
    if(question.length == 0){
        return;
    }
    document.getElementById("response").innerHTML = "<h3>Your response</h3>";
    document.getElementById("output").innerHTML = "Finding answers for question: " + question;
    console.log("Finding answers for question: ", question)
    //if the question does not end with \n, add it
    var match = /\r|\n/.exec(question);
    if (!match) {
        question += "\n";
        question += "\n";
        console.log("adding space breaks");
    }
    var data = JSON.stringify({
        "prompt": "Q: " + question + '\\nA:"',
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
                if (completion.length > 0) {
                    //if there is a quotation mark at the end, remove it
                    completion = completion.replace(/\"/g, "");
                    addAnnotations(completion, question);
                    document.getElementById("seeMore").innerHTML = "";
                    var searchMore = document.getElementById("seeMore");
                    var aElement = document.createElement("a");
                    var path = "https://www.google.com/search?q="
                    var queryParams = encodeURI(question);
                    var urlMore = path + queryParams
                    aElement.setAttribute("href", urlMore);
                    aElement.setAttribute("target", "_blank");
                    aElement.innerHTML = "See More";
                    searchMore.appendChild(aElement)
                } else {
                    document.getElementById("output").innerHTML = "No answer found";
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

function addAnnotations(answerText, question)
{
var urlpath = "https://api.dbpedia-spotlight.org/en/annotate?text=";
var queryParams = encodeURI(answerText);
var url = urlpath + queryParams

var xhr2 = new XMLHttpRequest();
xhr2.open("GET", url);
xhr2.addEventListener("readystatechange", function() 
{
   if (xhr2.readyState === 4)
   {
      var htmlResult = String(xhr2.responseText)
      var parsedText = new DOMParser().parseFromString(htmlResult, "text/html").getElementsByTagName("DIV")[0].innerHTML;
      document.getElementById("output").innerHTML = parsedText;

       chrome.storage.local.get(['questionsAndAnswers'], function(result) {
           questionsAndAnswers = result.questionsAndAnswers;
           console.log('Value currently is ' + questionsAndAnswers);

           if(!questionsAndAnswers){
               questionsAndAnswers = [];
           }

           questionsAndAnswers.push([question, parsedText]);

           chrome.storage.local.set({questionsAndAnswers: questionsAndAnswers}, function() {
               console.log('Value is set to ' + questionsAndAnswers);
           });
       });


   }
});
xhr2.send();
}

document.getElementById("key").onkeyup = function(e){
    console.log(e.target.value);
    chrome.storage.local.set({apiKey: e.target.value}, function() {
        console.log('Value is set to ' + e.target.value);
        apiKey = e.target.value;
    });
}

chrome.storage.local.get(['apiKey'], function(result) {
    apiKey = result.apiKey;
    console.log('Value currently is ' + apiKey);
});

chrome.storage.local.get(['questionsAndAnswers'], function(result) {
    questionsAndAnswers = result.questionsAndAnswers;
    console.log('Value currently is ' + questionsAndAnswers);
    if(!questionsAndAnswers){
        questionsAndAnswers = [];
    }
});

document.getElementById('searchBox').onkeyup = function()
{
  clearTimeout(timer);
  var query = document.getElementById("searchBox").value;
  timer = setTimeout(function(){giveAnswer(query);}, time)
}

document.getElementById('searchBox').onkeydown = function()
{
  clearTimeout(timer);
}

chrome.tabs.executeScript( {
    code: "window.getSelection().toString();",
}, function(selection) {
    if (!apiKey) {
        chrome.storage.local.get(['apiKey'], function(result) {
            apiKey = result.apiKey;
            giveAnswer(selection);
        });
    } else {
        giveAnswer(selection);
    }
});

function setHistory(index){
    let history = "last questions asked:";
    let len = questionsAndAnswers.length;
    for(let i = len - 1; i >= len - sizeHist; i--){
        console.log(questionsAndAnswers[len - i]);
        history += "<br/>";
        history += "<br/>Q: " + questionsAndAnswers[i][0];
        history += "<br/>A: " + questionsAndAnswers[i][1];
    }
    return history;
}

btnHistory.onclick = function() {
    document.getElementById('target-id').innerHTML = setHistory(sizeHist);
    modalHistory.style.display = "block";
}

btnSettings.onclick = function() {
    modalSettings.style.display = "block";
}

btnHelp.onclick = function() {
    modalHelp.style.display = "block";
}

window.onclick = function(event) {
    if (event.target == modalHistory) {
        modalHistory.style.display = "none";
    }
    if (event.target == modalSettings) {
        modalSettings.style.display = "none";
    }
    if (event.target == modalHelp) {
        modalHelp.style.display = "none";
    }
}