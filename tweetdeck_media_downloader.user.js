// ==UserScript==
// @name		deck test
// @include     https://tweetdeck.twitter.com/*
// @include		https://pbs.twimg.com/media/*
// ==/UserScript==

;(function() {
	'use strict';

	// download filename format
	// https://twitter.com/{userName}/status/{tweetId}
	// https://pbs.twimg.com/media/{randomImageNameWithoutExtension}.{extension} or
	// https://pbs.twimg.com/media/{randomImageName}
	let FILENAME_FORMAT = 'Twitter-{tweetId}-{userName}-{randomImageNameWithoutExtension}.{extension}';

	let BLACK_LIST = [
		'TwTimez',
	];

	// CONST VALUES
	let SCRIPT_NAME	= 'EZ_Twitter_Image_Downloader';
	let IFRAME_NAME	= SCRIPT_NAME + '_download_frame';

    const imgRe = new RegExp('https?://pbs.twimg.com/media/[-_.!~*\'()a-zA-Z0-9;\/:\@&=+\$,%#]+.jpg');

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

		// write css
		(function(){
			let cssElem = document.createElement('style');

			cssElem.innerHTML =
				'.ProfileTweet-action--ExtractImages:hover:hover * {' +
					'color : rgb(47,194,239);' +
				'}' +
				'.tweet.Tweet--invertedColors .ProfileTweet-action--ExtractImages:hover .ProfileTweet-actionButton {' +
					'color : rgb(47,194,239);' +
				'}' +
				'.tweet.Tweet--invertedColors .ProfileTweet-action--ExtractImages:hover .ProfileTweet-actionCount {' +
					'color : rgb(47,194,239);' +
				'}' +
				'.tweet.Tweet--invertedColors .ProfileTweet-action--ExtractImages .ProfileTweet-actionButton {' +
					'color : #fff;' +
				'}' +
				'.tweet.Tweet--invertedColors .ProfileTweet-action--ExtractImages .ProfileTweet-actionCount {' +
					'color : #fff;' +
				'}' +
				'.stream-container .AdaptiveStreamGridImage .grid-tweet-action.action-extractImage-container {' +
					'margin: 6px 4px;' +
				'}' +
				'.stream-container .AdaptiveStreamGridImage .grid-tweet-actions {' +
					'width: 110px !important;' +
				'}'
			;

			document.documentElement.appendChild(cssElem);

		})();

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
			if(BLACK_LIST.includes(userName))
				if(confirm(userName + 'はBLACK_LISTに登録されています。\nダウンロードを中止しますか？'))
					return false;

			return true;
		};


		// create button element
		let createButton = function(list){
			// get photo container
			//let imgs = list.parentNode.parentNode.parentNode.parentNode.getElementsByClassName('js-media-image-link');
            let imgs = list.parentNode.parentNode.parentNode.getElementsByClassName('js-media-image-link');

			// return if image not found
			if(imgs.length == 0) return undefined;

			let getTweetElementByListElement = function(elm){
				while(1){
					if(elm.classList.contains('stream-item')) break;
					elm = elm.parentNode;
				}
				return elm;
			}

			let btn = document.createElement('li');

			btn.setAttribute('class', 'ProfileTweet-action ProfileTweet-action--ExtractImages');

			btn.innerHTML =
				'<button class="ProfileTweet-actionButton js-actionButton" type="button">' +
					//'<div class="IconContainer js-tooltip" title="Extract Images">' +
						//'<span class="Icon Icon--medium Icon--media"></span>&nbsp;' +
					//'</div>' +
					'<span class="ProfileTweet-actionCount">' +
						'<span class="ProfileTweet-actionCountForPresentation">' + imgs.length + '</span>' +
					'</span>' +
				'</button>'
			;

			btn.addEventListener('click',function(event){
				// if not press shift key
				if(!(event || window.event).shiftKey){
					let tweetDivElement = getTweetElementByListElement(list);

					let tweetId = tweetDivElement.getAttribute('data-tweet-id');
                    let userName = tweetDivElement.getElementsByClassName('username')[0].textContent.substring(1);

					if(!originalTweetUserCheckByBlackList(userName)) return;

					iframeClear();
					for(let i = 0;i < imgs.length;i++) {
                        var url = imgs[i].getAttribute('style').match(imgRe)[0];
						iframeAdd(url, userName, tweetId);
                    }

				}else{
					let lastIndex = (imgs.length - 1);

					for(let i = lastIndex;0 <= i;i--){
						let imgurl = imgs[i].getAttribute('style').match(imgRe) + ':orig';
						window.open(imgurl);
					}

				}
			});

			return btn;

		};

		let createButtonForStream = function(list){
			let btn = document.createElement('li');

			btn.setAttribute('class', 'action-extractImage-container grid-tweet-action');

			btn.innerHTML =
				'<a class="js-action-extractImage" role="button">' +
					'<span class="Icon Icon--media Icon--small u-textUserColorHover">' +
					'</span>' +
					'<span class="u-hiddenVisually">画像保存</span>' +
				'</a>'
			;

			btn.addEventListener('click',function(event){
				let tweetElement = list.parentNode.parentNode;

				// if not press shift key
				if(!(event || window.event).shiftKey){
					let imgBaseUrl = tweetElement.getAttribute('data-url');
					let userName = tweetElement.getAttribute('data-screen-name');
					let tweetId = tweetElement.getAttribute('data-tweet-id');

					if(!originalTweetUserCheckByBlackList(userName)) return;

					iframeClear();
					iframeAdd(imgBaseUrl, userName, tweetId);

				}else{
					window.open(tweetElement.getAttribute('data-url') + ':orig');

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

			// get action list
			lists = findNode.getElementsByClassName('grid-tweet-actions');

			for(let i = 0;i < lists.length;i++){
				let list = lists[i];

				if(processedLists.has(list)) continue;

				processedLists.set(list, 1);

				let createdButton = createButtonForStream(list);

				if(createdButton != undefined){
					let oldButton = list.getElementsByClassName('action-extractImage-container')[0];
					if(oldButton) oldButton.parentNode.removeChild(oldButton);

					list.appendChild(createdButton);
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

