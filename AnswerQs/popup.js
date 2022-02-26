// timer variables
var timer;
var typetimer;
const time = 1700;

function giveAnswer(question) {
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
                    addAnnotations(completion);
                } else {
                    document.getElementById("output").innerHTML = "No answer found";
                }
            }
        }
    });

    xhr.open("POST", "https://api.openai.com/v1/engines/text-davinci-001/completions");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", "Bearer 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");

    xhr.send(data);
    return "hello there";
}

function addAnnotations(answerText)
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
   }
});
xhr2.send();
}

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
    giveAnswer(selection);
});