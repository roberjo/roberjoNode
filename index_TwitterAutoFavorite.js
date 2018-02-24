var Twit = require('twit');
var _ = require('underscore');
var moment = require('moment');
var config = require('./config.js');
require('log-timestamp');
var LanguageDetect = require('languagedetect');
var lngDetector = new LanguageDetect();


var T = new Twit({
    consumer_key: 'DELETED',           // <--- FILL ME IN
    consumer_secret: 'DELETED',        // <--- FILL ME IN
    access_token: 'DELETED',       // <--- FILL ME IN
    access_token_secret: 'DELETED',     // <--- FILL ME IN
    timeout_ms: 15*1000  // optional HTTP request timeout to apply to all requests.
});

// Twitter symbols array
var searchSymbols = ['javascript', 'angularjs', 'node.js', '#php', 'jquery', '#python', '#nodejs', 'asp.net', 'c#', 'web api', 'machine learning', 'markov chain'];

// Queue Array for tweets to favorite  --ME
var tweetQueue = [];
var currentTweetStreams = 0;

//
//  tweet 'Good Morning!'
//
//T.post('statuses/update', { status: "Let's go, Everyone! #ImOnline" }, function(err, data, response) {
//  console.log(data)
//})

console.log("Starting TwitterFavorite");
var minutes = 5, the_interval = minutes * 60 * 1000;

function tweetCollector(timeInterval){

	if(currentTweetStreams == 0) {

		console.log("Starting tweetCollector..");
		//  filter the twitter public stream by keywords.
		//
		var stream = T.stream('statuses/filter', { track: searchSymbols });

		console.log("Tweet Stream Started...");
		currentTweetStreams++;

		// Disconnect stream after 30 seconds
		setTimeout(function() { killStream(stream); }, 30000);  //--ME

		stream.on('limit', function (limitMessage) {
		  //Twitter API Limit Hit
		  console.log('Twitter API Limit Hit: ' + limitMessage)
		})

		stream.on('end', function (response) {
		  // Handle a disconnection
		  console.log('Stream Ended');
		});
	    
	    	stream.on('destroy', function (response) {
	      	  // Handle a 'silent' disconnection from Twitter, no end/error event fired
	      	  console.log('Stream Destroyed');
	    	});

		stream.on('message', function (msg) {
		  // Handle a Message.  These are sent all of the time, so just eat it until we get a msg object definition.
		  //console.log('[MESSAGE] Stream Message Received');
		});

	    	stream.on('delete', function (deleteMessage) {
		  //... 
		  console.log('Stream Delete Message: ' + deleteMessage);
		})

		stream.on('scrub_geo', function (scrubGeoMessage) {
		  //... 
		  console.log('Stream ScrubGeoMessage: ' + scrubGeoMessage);
		})

		stream.on('disconnect', function (disconnectMessage) {
		  //... 
		  console.log('[DISCONNECTED] Twitter Stream Disconnect Message. |Code: ' + disconnectMessage.disconnect.code + '|StreamName: ' + disconnectMessage.disconnect.stream_name + '|Reason: ' + disconnectMessage.disconnect.reason);
		})

		stream.on('connect', function (request) {
			console.log('[CONNECTING] Twitter Stream connection attempted.');
		});
				
		stream.on('connected', function (response) {
			console.log('[CONNECTED] Twitter Stream connection successful. (' + response.statusCode + ')');
		});

		stream.on('reconnect', function (request, response, connectInterval) {
		  // Handle a disconnection
		  console.log('[RECONNECTED] Twitter Stream reconnecting in ' + connectInterval + ' (' + response.statusCode + ')');
		});

		stream.on('warning', function (warning) {
		  //... 
		  console.log('[WARNING] Stream Warning. You are falling behind Twitter\'s firehose. ' + warning);
		})

		stream.on('error', function (Error) {
		  //... 
		  console.log('[ERROR] Stream Error! Message: ' + Error.message 
		  	+ '|StatusCode: ' + Error.statusCode 
		  	+ '|Code: ' + Error.code
		  	+ '|TwitterReply: ' + Error.twitterReply
		  	+ '|allErrors: ' + Error.allErrors);
		})

		stream.on('unknown_user_event ', function(eventMsg) {
			console.log('[UNKNOWN] Unknown User Event Message: ' + eventMsg)
		})
	    
		stream.on('tweet', function (tweet) {
			var tweetFavAlready = false; 
			console.log('[TWEET] Found a tweet to process! id_str:' + tweet.id_str + ' created_at: ' + tweet.created_at);

		    //Make sure it was a valid tweet
		    if (tweet.text !== undefined) {

		        //We're gonna do some indexOf comparisons and we want it to be case agnostic.
		        var text = tweet.text.toLowerCase();

		        var MatchedKeyword = 0;
		        
		        //Go through every symbol and see if any of the keywords were mentioned. If so, favorite the tweet
		        _.each(searchSymbols, function(v) {

		            if ((tweetFavAlready == false) && (text.indexOf(v.toLowerCase()) !== -1)) {

		            	MatchedKeyword = 1;

		            	var languageResults = lngDetector.detect(text);

		        		//console.log('LangResults: ' + tweet.id_str + '|' + languageResults);
		        		var englishTweet = 0;

		        		if((typeof(languageResults) != undefined) && (languageResults.length > 2)){
	        				for (var i = 0; i < 3; i++) {
					            if (languageResults[i][0] === 'english') {
					            	englishTweet = 1;
					                break;
					            }
					        }
		        		}
				        
		                
		                if((tweet.retweeted_status !== 'undefined') 
		                	&& (text.indexOf('rt ') !== 0) 
		                	&& (tweet.favorited == false) 
		                	&& (tweet.user.following == null) 
		                	&& (tweet.user.followers_count > 50)
		                	&& (englishTweet == 1)
		                	&& (tweet.user.screen_name != 'dailyJsPackages')
		                	&& (tweet.user.screen_name != 'NutKacPI')
		                	) {
		                  
		                  	//console.log('This tweet looks ready to favorite!');
		                	console.log('[TWEET] Good Tweet found: URL: https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str + '|@'+tweet.user.screen_name + '|Favorited: ' + tweet.favorited + '|Following: ' + tweet.user.following + '|TweetText: ' + text + '|SymbolFound: ' + v);
		                  
							tweetFavAlready = true;
							saveTweet(tweet);
		                }
		            }
		        });
			}
		});
	}
	setTimeout(function() { tweetCollector(the_interval); }, timeInterval);
}

// Start the Tweet Collection Loop Thread
tweetCollector(the_interval);


// Tweet Favoriting Thread
function tweetProcessor(timeInterval) {
	// Check the global queue to see if we have any tweets to favorite
	// If we have tweets old enough to fav, send them to the favoriting function
	console.log("[PROCESSOR] Starting tweetProcessor|NumOfTweetsInStack:" + tweetQueue.length);
	var tweetsFavd = 0;
	for (var i = 0, len = tweetQueue.length; i<len; i++) {

        // Calculate how old this tweet is
		var MomentNow = moment();
		var tweetMoment = moment(tweetQueue[i].created_at, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en');
		var tweetMomentDiff = MomentNow.diff(tweetMoment, 'seconds');

		// If tweet greater than 30 s old, fave it
    	if(tweetMomentDiff > 30) {
    		tweetsFavd++;
    		// Pop this tweet out of the stack
			var tweetObject = tweetQueue.splice( i, 1 )[0];

			//Favorite that tweet!
			setTimeout(favoriteTweet(tweetObject), 5000);
		}
	};
	console.log("[PROCESSOR] Ending tweetProcessor|Favd " + tweetsFavd + " of " + tweetQueue.length + " tweets in the stack.");
	setTimeout(function() { tweetProcessor(the_interval); }, timeInterval);
}

// Start the Tweet Processing Loop Thread
setTimeout(function() { tweetProcessor(the_interval); }, 30000);


function killStream(streamEventEmitter) {
	console.log("[KILLSTREAM] Killing Stream");
	streamEventEmitter.stop();
	console.log("[KILLSTREAM] Stream Killed");
	currentTweetStreams--;
}

function saveTweet(tweet){
    tweetQueue.push(tweet);
}

function favoriteTweet(tweet) {
    T.post('favorites/create', {id: tweet.id_str}, function(err, data, response) {
        if (err) {
            console.log("[FAVTWEET ERROR] Couldnt favorite tweet! Err:" + err + "|ID: " + data.id_str);
        } else {
            console.log('[FAVTWEET SUCCESS] Create.Favorite: Success|ID: ' + data.id_str + '|Favorited: ' + data.favorited + '|');  
        }
    });
}
