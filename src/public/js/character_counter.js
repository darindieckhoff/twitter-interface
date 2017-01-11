//tweet character counter
$('#tweet-textarea').keyup(function() {
  var tweetLength = 140 - $('#tweet-textarea').val().length;
  $('#tweet-char').html(tweetLength);
})
