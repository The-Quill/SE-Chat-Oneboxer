// ==UserScript==
// @name SE-Chat-Oneboxer
// @description A link oneboxer for SE Chat
// @version 0.0.1
// @match *://chat.stackexchange.com/rooms/*
// @match *://chat.stackoverflow.com/rooms/*
// @match *://chat.meta.stackexchange.com/rooms/*
// @author The-Quill
// @downloadURL  https://github.com/The-Quill/SE-Chat-Oneboxer/raw/master/se-chat-oneboxer.user.js
// @updateURL https://github.com/The-Quill/SE-Chat-Oneboxer/raw/master/se-chat-oneboxer.user.js
// @grant       GM_xmlhttpRequest
// @run-at document-end
// ==/UserScript==

window.addEventListener("DOMNodeInserted", convert);
var instagram = document.createElement('script');
instagram.setAttribute('async', '');
instagram.setAttribute('defer', '');
instagram.src = '//platform.instagram.com/en_US/embeds.js';
document.head.appendChild(instagram);

var formats = {
    'videos': {
        'on': false,
        'link_match': /\.(avi|mov|mp4|webm)$/,
        'format': '<video src="##link##" controls style="width: 300px; height: 150px">Sorry, your browser doesn\'t support the video tag.</video>'
    },
    'instagram': {
        'on': false,
        'link_match': /(instagr\.am|instagram\.com)/,
        'api': instagram_api
    }
};
var formatKeys = Object.keys(formats);
function convert(){
    var messages = document.querySelectorAll('.content');
    for (let i = 0; i < messages.length; i++){
        var message = messages[i];
        if (message.classList.contains('processed')) continue;
        message.classList.add('processed');
        var links = message.querySelectorAll('a');
        var text = 'http://' + message.textContent;
        if (links.length > 0){
            text = links[links.length - 1].href;
        }
        formatKeys.forEach(function(key){
            var format = formats[key];
            if (text.match(format.link_match) == null) return;
            console.log(text);
            if (format.hasOwnProperty('format')){
                message.innerHTML = format.format.replace('##link##', text);
            } else if (format.hasOwnProperty('api')){
                format.api(text, message);
            }
        });
    }
}

function instagram_api(link, element){
    GM_xmlhttpRequest({
        method: "GET",
        url: "https://api.instagram.com/oembed?url=" + link,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        onload: function(response) {
            if (response.status != 200) return;
            try {
                element.innerHTML = "<div style='height: 403px; width: 300px;'>" + JSON.parse(response.responseText).html + "</div>";
            }
            catch (c){ return; }
            if (window.instgrm) window.instgrm.Embeds.process();
        }
    });
}