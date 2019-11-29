// ==UserScript==
// @name		Ez Twimg Downloader DECK
// @description	TweetDeckの画像を簡単に保存するUserScriptです。
// @author		ZEROssk
// @namespace	http://zerono.cloud
// @include     https://tweetdeck.twitter.com/*
// @include		https://pbs.twimg.com/media/*
// @version		2.8.3
// @grant		none
// @license		MIT License
// @updateURL   https://github.com/ZEROssk/TweetDeck_image_Downloader/raw/master/tweetdeck_media_downloader.user.js
// ==/UserScript==

// Original Code author
//		yanorei32
// Original Code
//		https://gist.github.com/Yanorei32/ef72fa76511c1ce5d5d6d725c2fa8b88

;(function() {
	'use strict';

	// download filename format
	// https://pbs.twimg.com/media/{randomImageNameWithoutExtension}.{extension} or
	// https://pbs.twimg.com/media/{randomImageName}
	let FILENAME_FORMAT = 'Twitter-{tweetId}-{userName}-{randomImageNameWithoutExtension}.{extension}';

	let BLACK_LIST = [
		'TwTimez',
	];

	// CONST VALUES
	let SCRIPT_NAME	= 'EZ_Twitter_Image_Downloader_DECK';
	let IFRAME_NAME	= SCRIPT_NAME + '_download_frame';

	if(window !== window.parent){
		// iframe functions

		// check iframe name
		if(window.name.split(',')[0] != IFRAME_NAME) return;

		// create link elem and download
		(function() {
			let linkElem = document.createElement('a');

			let userName = window.name.split(',')[1];
			let tweetId = window.name.split(',')[2];
			let randomImageName = (window.location.href.split('/').pop().split(':')[0]);
			let randomImageNameWithoutExtension = randomImageName.slice(0, randomImageName.length - 4);
			let extension = randomImageName.slice(-3);

			let filename = FILENAME_FORMAT;

			linkElem.href = window.location.href;

			filename = filename.replace(/{userName}/g, userName);
			filename = filename.replace(/{tweetId}/g, tweetId);
			filename = filename.replace(/{randomImageNameWithoutExtension}/g, randomImageNameWithoutExtension);
			filename = filename.replace(/{randomImageName}/g, randomImageName);
			filename = filename.replace(/{extension}/g, extension);

			linkElem.download = filename;

			document.documentElement.appendChild(linkElem);

			linkElem.click();

		})();

	}else{
		// parent window functions

		// init processed list
		let processedLists = new WeakMap();

		// iframe
		let iframeDiv;

		// write div for iframe
		(function(){
			iframeDiv = document.createElement('div');
			document.documentElement.appendChild(iframeDiv);

		})();

		let iframeClear = function(){
			iframeDiv.textContent = null;

		};

		let iframeAdd = function(imageBaseURL, userName, tweetId){
			let iframe = document.createElement('iframe');

			iframe.style.width = iframe.style.height = '0';
			iframe.style.visibility = 'hidden';

			iframe.src	= imageBaseURL;
			iframe.name	= IFRAME_NAME + ',' + userName + ',' + tweetId;

			iframeDiv.appendChild(iframe);

		};


		let originalTweetUserCheckByBlackList = function(userName){
			if(BLACK_LIST.includes(userName)) {
				if(confirm(userName + 'はBLACK_LISTに登録されています。\nダウンロードを中止しますか？')) {
					return false;
				}
			}

			return true;
		};


		// create button element
		let createButton = function(list){
			// get photo container
			let ActionItem = list.getElementsByClassName('tweet-action-item');
			let imgs = list.parentNode.parentNode.parentNode.getElementsByClassName('js-media-image-link');
			let simg = list.parentNode.parentNode.parentNode.getElementsByClassName('media-img');
			let gif = list.parentNode.parentNode.parentNode.getElementsByClassName('js-media-gif-container');

			// return if media not found
			if(imgs.length == 0 && simg.length == 0 && gif.length == 0) {
				return undefined
			}

			for(let i = 0;i < ActionItem.length;i++) {
				ActionItem[i].className = "tweet-action-item pull-left margin-r--5";
			}

			let getTweetElementByListElement = function(elm){
				while(1){
					if(elm.classList.contains('stream-item')) break;
					elm = elm.parentNode;
				}
				return elm;
			}

			let btn = document.createElement('li');

			btn.setAttribute('class', 'tweet-action-item position-rel pull-left margin-r--0');

			if(gif.length == 0) {
				btn.innerHTML =
					'<a class="tweet-action ">' +
						'<i class="icon icon-image txt-center pull-left txt-size--17"></i>' +
						'<span class="pull-right margin-l--2 margin-t--1 txt-size--12">' + imgs.length + '</span>' +
					'</a>'
				;
			} else {
				btn.innerHTML =
					'<a class="tweet-action ">' +
						'<i class="icon icon-image txt-center pull-left txt-size--17"></i>' +
						'<span class="pull-right margin-l--2 margin-t--1 txt-size--12">' + gif.length + '</span>' +
					'</a>'
				;
			}

			btn.addEventListener('click',function(event){
				const imgRe = new RegExp('https?://pbs.twimg.com/media/[-_!~*\'()a-zA-Z0-9;\/:\@&=+\$,%#]+');
				const imgReS = new RegExp('https?://pbs.twimg.com/media/[-_.!~*\'()a-zA-Z0-9;\/:\@&=+\$,%#]+');
				// if not press shift key
				if(!(event || window.event).shiftKey){
					let tweetDivElement = getTweetElementByListElement(list);
					let tweetId = tweetDivElement.getAttribute('data-tweet-id');
					let userName = tweetDivElement.getElementsByClassName('username')[0].textContent.substring(1);

					if(!originalTweetUserCheckByBlackList(userName)) return;

					iframeClear();
					if(simg.length != 0) {
						let surl = simg[0].getAttribute('src').match(imgReS)[0]+".jpg";
						iframeAdd(surl, userName, tweetId);
					} else if(imgs.length != 0) {
						for(let i = 0;i < imgs.length;i++) {
							var url = imgs[i].getAttribute('style').match(imgRe)[0]+".jpg";
							iframeAdd(url, userName, tweetId);
						}
					} else {
						let gifurl = gif[0].getElementsByClassName('js-media-gif')[0].getAttribute('src');
						window.open(gifurl);
					}
				}else{
					if(simg.length != 0) {
						let simgurl = simg[0].getAttribute('src').match(imgReS)[0]+".jpg";
						window.open(simgurl);
					} else if(imgs.length != 0) {
						let lastIndex = (imgs.length - 1);
						for(let i = lastIndex;0 <= i;i--){
							let imgurl = imgs[i].getAttribute('style').match(imgRe)[0] + ':orig';
							window.open(imgurl);
						}
					} else {
						let gifurl = gif[0].getElementsByClassName('js-media-gif')[0].getAttribute('src');
						window.open(gifurl);
					}
				}
			});

			return btn;

		};

		// add buttons 2 elem
		let addButtons = function(findNode){
			let lists;

			// get action list
			lists = findNode.getElementsByClassName('js-tweet-actions tweet-actions');

			if(lists.length == 0) {
				lists = findNode.getElementsByClassName('tweet-detail-actions');
			}

			for(let i = 0;i < lists.length;i++){
				let list = lists[i];

				// check processed list
				if(processedLists.has(list)) continue;

				// set to processed list
				processedLists.set(list, 1);

				// create button
				let createdButton = createButton(list);

				// add button if createdButton is not undefined
				if(createdButton != undefined){
					// remove old button (perhaps a browser bug)
					let oldButton = list.getElementsByClassName('ProfileTweet-action--ExtractImages')[0];
					if(oldButton) oldButton.parentNode.removeChild(oldButton);

					list.insertBefore(
						createdButton,
						list.getElementsByClassName('ProfileTweet-action--more')[0]
					);

				}
			}
		};

		let toArray = function(array_like_object) {
			return Array.prototype.slice.call(array_like_object);
		};

		// create mutation observer
		new MutationObserver(function(records){
			// loop each record
			records.forEach(function(record){
				// loop each added node
				toArray(record.addedNodes).forEach(function(addedNode){
					// return if node is not a element node
					if(addedNode.nodeType != Node.ELEMENT_NODE) return;

					addButtons(addedNode);

				});
			});
		}).observe(
			document.body,
			{
				childList: true,
				subtree: true,
			}
		);

		// add button
		addButtons(document);
	}
})();

