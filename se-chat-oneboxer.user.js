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

var formats = {
    'videos': {
        'on': false,
        'link_match': /\.(avi|mov|mp4|webm)$/,
        'format': '<video src="##link##" controls style="width: 300px; height: 150px">Sorry, your browser doesn\'t support the video tag.</video>'
    },
    'instagram': {
        'on': false,
        'link_match': / /,
        'api': instagram_api
    }
};
var formatKeys = Object.keys(formats);

var messages = document.querySelectorAll('.content');
for (let i = 0; i < messages.length; i++){
    var message = messages[i];
    var links = message.querySelectorAll('a');
    var text = 'http://' + message.textContent;
    if (links.length > 0){
        text = links[links.length - 1].href;
    }
    formatKeys.forEach(function(key){
        var format = formats[key];
        if (text.match(format.link_match) != null){
            message.innerHTML = format.format.replace('##link##', text);
        }
    });
}

function instagram_api(link, element){
    GM_xmlhttpRequest({
        method: "GET",
        url: "https://api.instagram.com/oembed",
        data: "url="+link,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        onload: function(response) {
            element.innerHTML = response;
        }
    });
}