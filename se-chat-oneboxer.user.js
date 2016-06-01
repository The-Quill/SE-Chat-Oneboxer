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
    },
    'github': {
        'on': false,
        'link_match': /github\.com/,
        'api': github_api
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
function github_api(link, element){
    var subdomain = 'user';
    if (link.match(/(\/[\w\d-_]+\/[\w\d-_]+)/) != null){
        subdomain = 'repos';
    }
    GM_xmlhttpRequest({
        method: "GET",
        url: "https://api.github.com/" + subdomain + link.replace('https://', '').replace('http://', '').replace('github.com', ''),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        onload: function(response) {
            if (response.status != 200) return;
            try {
                var text = JSON.parse(response.responseText);
                GM_xmlhttpRequest({
                    method: "GET",
                    url: text.contributors_url,
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    onload: function(response) {
                        if (response.status != 200) return;
                        try {
                            element.innerHTML = '<div class="ob-docs ob-docs-topic"><div class="topic-row"><div class="topic-metrics"><div class="topic-metric score-metric"><div class="topic-metric-number">' + text.stargazers_count + '</div><div class="topic-metric-label">stars</div></div><div class="topic-metric example-metric"><div class="topic-metric-number">' + text.watchers_count + '</div><div class="topic-metric-label">watchers</div></div></div><div class="topic-links"><h2><a class="doc-topic-link" href="' + text.html_url + '">' + text.name+ '</a></h2><div class="examples">' + text.description + '</div></div><div class="topic-users"><div class="contributor-count">' + JSON.parse(response.responseText).length + ' contributor/s</div><div class="last-editor"><div class="user-info "><div class="user-gravatar32"><a href="' + text.owner.html_url + '"><div class="gravatar-wrapper-32"><img src="' + text.owner.avatar_url + '" alt="" width="32" height="32"></div></a></div><div class="user-details"><a href="' + text.owner.html_url + '">' + text.owner.login + '</a></div></div></div></div></div></div>';
                        }
                        catch (c){ return; }
                    }
                });
            }
            catch (c){ return; }
        }
    });
}