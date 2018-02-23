var Twit = require('twit');
var _ = require('underscore');
var moment = require('moment');
var config = require('./config.js');
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

//
//  tweet 'Good Morning!'
//
//T.post('statuses/update', { status: "Let's go, Everyone! #ImOnline" }, function(err, data, response) {
//  console.log(data)
//})

console.log("Starting SetInterval");
var minutes = 5, the_interval = minutes * 60 * 1000;
setInterval(function() {
	console.log("Starting Stream");
	//  filter the twitter public stream by keywords.
	//
	var stream = T.stream('statuses/filter', { track: searchSymbols });

	console.log("Streaming...");

	// Disconnect stream after 30 seconds
    setTimeout(killStream, 30000, stream);

	stream.on('limit', function (limitMessage) {
	  //Twitter API Limit Hit
	  console.log('Twitter API Limit Hit: ' + limitMessage)
	})

	stream.on('end', function (response) {
      // Handle a disconnection
      console.log('Stream End');
    });
    
    stream.on('destroy', function (response) {
      // Handle a 'silent' disconnection from Twitter, no end/error event fired
      console.log('Stream Destroyed');
    });

    stream.on('error', (err) => {
	  console.error('ERROR: ' + err);
	});

	stream.on('tweet', function (tweet) {
		console.log('Found a tweet to like! id_str:' + tweet.id_str + ' created_at: ' + tweet.created_at);

		//Make sure it was a valid tweet
	    if (tweet.text !== undefined) {

	        //We're gunna do some indexOf comparisons and we want it to be case agnostic.
	        var text = tweet.text.toLowerCase();

	        var MatchedKeyword = 0;
	        
	        //Go through every symbol and see if it was mentioned. If so, favorite it
	        _.each(searchSymbols, function(v) {

	            if (text.indexOf(v.toLowerCase()) !== -1) {

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
	                  
	                  	console.log('This tweet looks ready to favorite!');
	                	console.log('URL: https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str + '|@'+tweet.user.screen_name + '|Favorited: ' + tweet.favorited + '|Following: ' + tweet.user.following + '|TweetText: ' + text + '|SymbolFound: ' + v);
	                  
						// Calculate how old this tweet is
						//var MomentNow = moment();

						//var tweetMoment = moment(tweet.created_at);

						//var tweetMomentDiff = MomentNow.diff(tweetMoment, 'seconds');

						// If tweet less than 30 s old, set interval delay to prevent premature action
	                	//if(tweetMomentDiff < 30) {
						//	setTimeout(favoriteTweet, 15*1000, tweet.id_str);
						//} else {
							favoriteTweet(tweet.id_str);
						//}
	                }

	                //if(MatchedKeyword == 1){
	                //	break;
	                //}
	            }
	        });
		}
	});

  //console.log('end of run call');
}, the_interval);

function killStream(streamEventEmitter) {
	console.log("Killing Stream");
	streamEventEmitter.stop();
	console.log("Stream stopped");
}

function favoriteTweet(tweet_id) {
    T.post('favorites/create', {id: tweet_id}, function(err, data, response) {
        if (err) {
            console.log("Couldnt favorite tweet! Err:" + err + "|ID: " + data.id_str);
        } else {
            console.log('Create.Favorite: Success|ID: ' + data.id_str + '|Favorited: ' + data.favorited + '|');  
        }
    });
}
	
