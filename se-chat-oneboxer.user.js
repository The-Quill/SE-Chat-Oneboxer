// ==UserScript==
// @name SE-Chat-Oneboxer
// @description A link oneboxer for SE Chat
// @version 1.0.4
// @match *://chat.stackexchange.com/rooms/*
// @match *://chat.stackoverflow.com/rooms/*
// @match *://chat.meta.stackexchange.com/rooms/*
// @author The-Quill
// @downloadURL  https://github.com/The-Quill/SE-Chat-Oneboxer/raw/master/se-chat-oneboxer.user.js
// @updateURL https://github.com/The-Quill/SE-Chat-Oneboxer/raw/master/se-chat-oneboxer.user.js
// @grant       GM_xmlhttpRequest
// @run-at document-end
// ==/UserScript==

var oneboxerLocalStorageLookupKey = "The-Quill/SE-Chat-Oneboxer";
var version = "1.0.4";
var fixedWindow = window;
if (unsafeWindow){
    fixedWindow = unsafeWindow;
}

var defaultFormats = {
    'videos': {
        'name': 'Videos',
        'on': false,
        'link_match': /\.(avi|mov|mp4|webm)$/,
        'format': '<video src="##link##" controls style="width: 300px; height: 150px">Sorry, your browser doesn\'t support the video tag.</video>'
    },
    'instagram': {
        'name': 'Instagram (post and photo)',
        'on': false,
        'link_match': /(instagr\.am|instagram\.com)/,
        'api': 'instagram'
    },
    'instagram_photos': {
        'name': 'Instagram (photo only) (don\'t select with the one above)',
        'on': true,
        'link_match': /(instagr\.am|instagram\.com)/,
        'api': 'instagram_photos'
    },
    'github': {
        'name': 'GitHub',
        'on': false,
        'link_match': /github\.com/,
        'api': 'github'
    },
    'commitstrip': {
        'name': 'CommitStrip',
        'on': false,
        'link_match': /commitstrip\.com/,
        'api': 'commitstrip'
    },
    'strawpoll': {
        'name': 'Straw Poll',
        'on': false,
        'link_match': /strawpoll\.me/,
        'api': 'strawpoll'
    },
    'coding_horror': {
        'name': 'Coding Horror',
        'on': true,
        'link_match': /blog\.codinghorror\.com/,
        'api': 'coding_horror'
    },
    'vimeo': {
        'name': 'Vimeo',
        'on': true,
        'link_match': /vimeo\.com/,
        'api': 'vimeo'
    }
};

if (!localStorage.hasOwnProperty(oneboxerLocalStorageLookupKey) || !JSON.parse(localStorage.getItem(oneboxerLocalStorageLookupKey)).hasOwnProperty('formats') || JSON.parse(localStorage.getItem(oneboxerLocalStorageLookupKey)).version != version){
    localStorage.setItem(oneboxerLocalStorageLookupKey, JSON.stringify({formats: defaultFormats, version: version}));
}

fixedWindow.addEventListener("DOMNodeInserted", convert);
var instagram = document.createElement('script');
instagram.setAttribute('async', '');
instagram.setAttribute('defer', '');
instagram.src = '//platform.instagram.com/en_US/embeds.js';
document.head.appendChild(instagram);

var oneboxer = document.createElement('a');
oneboxer.id = "oneboxer";
oneboxer.setAttribute("title", "Set the oneboxing options");
oneboxer.textContent = "| oneboxer";

fixedWindow.onload = function(){
    fixedWindow.instgrm.Embeds.process();
};
oneboxer.addEventListener('click', function(){
    var storedEvents = JSON.parse(localStorage.getItem(oneboxerLocalStorageLookupKey)).formats;
    var contentString = '<div class="wmd-prompt-background" style="position: fixed; top: 0px; z-index: 1000; opacity: 0.5; left: 0px; width: 100%; height: 100%;"></div> \
    <div style="top: 4%; left: 12%; display: block; padding: 10px; position: fixed; width: 75%; z-index: 1001;" class="wmd-prompt-dialog"> \
        <div style="position: absolute; right: 20px; bottom: 5px; font-size: 10px;">SE Chat Oneboxer by <a title="quill\'s website" href="http://codequicksand.com">Quill</a></div> \
        <p><b> SE Chat Oneboxer settings.</b></p> \
        <p style="padding-top: 0.1px;"></p> \
        <input class="button" type="button" id="_save" value="Save" style="width: 8em; margin: 10px;">\
        <input class="button" type="button" id="_close" value="Close" id="close-dialog-button" style="width: 8em; margin: 10px 10px 20px;"><br />';
    Object.keys(storedEvents).forEach(function(key){
        var event = storedEvents[key];
        contentString += '<input type="checkbox" id="_' + key + '"' + (event.on ? "checked" : "") + '> <label for="cbox2">' + event.name + '</label><br />';
    });
    contentString += "</div>";
    $('body').append(contentString);
    var saveElement = document.querySelector("#_save");
    var closeElement = document.querySelector("#_close");
    saveElement.addEventListener('click', function(){
        var elems = document.querySelectorAll('.wmd-prompt-dialog input[type=checkbox]');
        var storedEvents = JSON.parse(localStorage.getItem(oneboxerLocalStorageLookupKey)).formats;
        for (var i = 0; i < elems.length; i++){
            storedEvents[Object.keys(storedEvents)[i]].on = elems[i].checked;
        }
        localStorage.setItem(oneboxerLocalStorageLookupKey, JSON.stringify({formats: storedEvents, version: version}));
        closeElement.click();
    });
    closeElement.addEventListener('click', function(){
        var background = document.querySelector(".wmd-prompt-background");
        background.remove();
        var dialog = document.querySelector(".wmd-prompt-dialog");
        dialog.remove();
    });
});
var sidebar = document.getElementById('sidebar-menu');
sidebar.appendChild(oneboxer);

var storedEvents = JSON.parse(localStorage.getItem(oneboxerLocalStorageLookupKey)).formats;
var formatKeys = Object.keys(defaultFormats).filter(function(format){ return format in storedEvents ? storedEvents[format].on : false; });
function convert(){
    var storedEvents = JSON.parse(localStorage.getItem(oneboxerLocalStorageLookupKey)).formats;
    var formatKeys = Object.keys(defaultFormats).filter(function(format){ return format in storedEvents ? storedEvents[format].on : false; }) || [];
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
        var textInsert = function(text){
            if (text == message.innerHTML){
                message.innerHTML = text;
            } else {
                message.innerHTML += "<br />" + text;
            }
        }
        formatKeys.forEach(function(key){
            var format = defaultFormats[key];
            if (text.match(format.link_match) == null) return;
            if (format.hasOwnProperty('format')){
                textInsert(format.format.replace('##link##', text));
            } else if (format.hasOwnProperty('api')){
                api[format.api](text, textInsert);
            }
        });
    }
}
var api = {
    strawpoll: function(link, textInsert){
        var text = '<iframe src="http://www.strawpoll.me/embed_1/' + link.replace('http://', '').replace('https://', '').replace('www.', '').replace('strawpoll.me/', '') + '" style="width:600px; height:314px; border:0;">Loading poll...</iframe>';
        textInsert(text)
    },
    coding_horror: function(link, textInsert){
        GM_xmlhttpRequest({
            method: "GET",
            url: link,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: function(response) {
                if (response.status != 200) return;
                try {
                    var fakeElement = document.createElement('div');
                    fakeElement.innerHTML = response.responseText;
                    var title = fakeElement.querySelector('title').textContent;
                    var date = fakeElement.querySelector('.post-meta time').textContent;
                    var text = fakeElement.querySelector('.post-content').innerText;
                    var trimmed = text.substring(0, 350);
                    if (trimmed.lastIndexOf('\n') != -1){
                        trimmed = trimmed.substring(0, trimmed.lastIndexOf('\n'));
                    } else if (trimmed.lastIndexOf(' ') != -1){
                        trimmed = trimmed.substring(0, trimmed.lastIndexOf(' '));
                    }

                    var content = '<div class="onebox" style="padding: 0.8em 1.5em; background-color: white; color: #444;"><div class="ob-blog-title"><a href="' + link + '"><img src="https://blog.codinghorror.com/assets/images/codinghorror-app-icon.png?v=bbaae030ab" alt="Coding Horror Logo" width="50" height="50">' + title + '</a></div><div class="ob-blog-meta">' + date + '</div><div class="ob-blog-text">' + trimmed + '</div></div>';
                    textInsert(content)
                }
                catch (c){ return; }
            }
        });
    },
    instagram: function(link, textInsert){
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://api.instagram.com/oembed?url=" + link,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: function(response) {
                if (response.status != 200) return;
                try {
                    var text = "<div style='height: 403px; width: 300px;'>" + JSON.parse(response.responseText).html + "</div>";
                    textInsert(text)
                }
                catch (c){ return; }
                if (fixedWindow.instgrm) fixedWindow.instgrm.Embeds.process();
            }
        });
    },
    instagram_photos: function(link, textInsert){
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://api.instagram.com/oembed?url=" + link,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: function(response) {
                if (response.status != 200) return;
                try {
                    var text = "<img src='" + JSON.parse(response.responseText).thumbnail_url + "' style='height: 403px; width: 300px;' />";
                    textInsert(text)
                }
                catch (c){ return; }
                if (fixedWindow.instgrm) fixedWindow.instgrm.Embeds.process();
            }
        });
    },
    vimeo: function(link, textInsert){
        var text = '<iframe src="//player.vimeo.com/video/' + link.replace('https://', '').replace('http://', '').replace('vimeo.com', '') + '" width="300" height="150" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
        textInsert(text);
    },
    commitstrip: function(link, textInsert){
        GM_xmlhttpRequest({
            method: "GET",
            url: link,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: function(response) {
                if (response.status != 200) return;
                try {
                    var fakeElement = document.createElement('div');
                    fakeElement.innerHTML = response.responseText;
                    var img = fakeElement.querySelector('.entry-content img');
                    textInsert("<img src='" + img.src + "' style='height: 403px; width: 300px;'>");
                }
                catch (c){ return; }
            }
        });
    },
    github: function(link, textInsert){
        var subdomain = 'user';
        if (link.match(/(\/[\w\d-_]+\/[\w\d-_]+)/) != null){
            subdomain = 'repos';
        }
        if (link.endsWith('/')){
            link = link.slice(0, link.lastIndexOf('/'))
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
                    if (subdomain == "repos"){
                        GM_xmlhttpRequest({
                            method: "GET",
                            url: text.contributors_url,
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            onload: function(response) {
                                var contributors = '';
                                if (response.status == 200){
                                    try {
                                        contributors = '<div class="contributor-count">' + JSON.parse(response.responseText).length + ' contributor/s</div>';
                                    }
                                    catch (c){}
                                }
                                var content = '<div class="ob-docs ob-docs-topic"><div class="topic-row"><div class="topic-metrics"><div class="topic-metric score-metric"><div class="topic-metric-number">' + text.stargazers_count + '</div><div class="topic-metric-label">stars</div></div><div class="topic-metric example-metric"><div class="topic-metric-number">' + text.subscribers_count + '</div><div class="topic-metric-label">watchers</div></div></div><div class="topic-links"><h2><a class="doc-topic-link" href="' + text.html_url + '">' + text.name+ '</a></h2><div class="examples">' + text.description + '</div></div><div class="topic-users">' + contributors + '<div class="last-editor"><div class="user-info "><div class="user-gravatar32"><a href="' + text.owner.html_url + '"><div class="gravatar-wrapper-32"><img src="' + text.owner.avatar_url + '" alt="" width="32" height="32"></div></a></div><div class="user-details"><a href="' + text.owner.html_url + '">' + text.owner.login + '</a></div></div></div></div></div></div>';
                                textInsert(content)
                            }
                        });
                    }
                }
                catch (c){ return; }
            }
        });
    }
};
