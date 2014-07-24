/*
 * This file is part of BrightRoll HAX <http://adblockplus.org/>,
 * Copyright (C) 2006-2014 Eyeo GmbH
 *
 * BrightRoll HAX is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * BrightRoll HAX is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with BrightRoll HAX.  If not, see <http://www.gnu.org/licenses/>.
 */

var FilterNotifier = require("filterNotifier").FilterNotifier;
var platform = require("info").platform;

var onFilterChangeTimeout = null;
function onFilterChange()
{
  onFilterChangeTimeout = null;
  ext.webRequest.handlerBehaviorChanged();
}

var importantNotifications = {
  'filter.added': true,
  'filter.removed': true,
  'filter.disabled': true,
  'subscription.added': true,
  'subscription.removed': true,
  'subscription.disabled': true,
  'subscription.updated': true,
  'load': true
};

FilterNotifier.addListener(function(action)
{
  if (action in importantNotifications)
  {
    // Execute delayed to prevent multiple executions in a quick succession
    if (onFilterChangeTimeout != null)
      window.clearTimeout(onFilterChangeTimeout);
    onFilterChangeTimeout = window.setTimeout(onFilterChange, 2000);
  }
});

// http://tools.btrll.com/wiki/Testing_RTBD_end-to-end_on_Stage#Testing
// http://test.btrll.com/vast_monster?vast_url=http%3A%2F%2Fvast.bp3850308.btrll.com%2Fvast%2F3850308&content_vid=http%3A%2F%2Famscdn.btrll.com%2Fproduction%2F5798%2Fbrvideo.flv&w=300&h=250&autostart=on
// https://github.com/prasmussen/chrome-cli
// brew install chrome-cli

var platform ={};
platform['brightroll'] = {
  "handle": "brightroll",
  "brand" : "BrightRoll Platform",
  "lifecycle" : {
      "player" : new RegExp('.*cache.btrll.com/jwplayer/.*','ig'),
      "decision" : new RegExp('vast.*.btrll.com','ig'),
      "video" : new RegExp('.*brxcdn.*.btrll.com/production/.*(flv|mpeg|mpg|mov|mp4)','ig'),
      "companion" : new RegExp('.*brxcdn.*.btrll.com/production/.*(jpg|jpeg|png|gif)','ig'),
      "metrics" : new RegExp('brxserv.*.btrll.com','ig')
    }
  };
//http://r12---sn-a5m7lner.c.2mdn.net/videoplayback/id/06fd7765f7b33ba1
platform['adx'] = {
  "handle": "adx",
  "brand" : "DoubleClick Ad Exchange",
  "lifecycle" : {
      "player" : "",
      "decision" : "",
      "video" : new RegExp('.*2mdn.net/videoplayback/.*(flv|mpeg|mpg|mov|mp4)','ig'),
      "companion" : "",
      "metrics" : ""
    }
  };

function notifyAdtribution(platform, url) {
  var msg = "Adtribution: " + platform.brand;
  var noti = chrome.notifications.create(
    'name-for-notification',{   
    'type': 'basic', 
    'iconUrl': 'icons/abp-48.png', 
    'title': msg,
    'message': url
    },
    function() {
      //alert('what?');
    }
  );
}

console.log("BRAND: "+JSON.stringify(platform));

function onBeforeRequest(url, type, page, frame)
{
  // console.log("url "+url);
  // console.log("type "+type);
  // console.log("page "+page);
  // console.log("frame "+frame);

  platform.each(function(k, v) {
      alert('key is: ' + k + ', value is: ' + v);
  });

  if (platform['brightroll'].lifecycle.video.test(url)) {
    notifyAdtribution(platform['brightroll'], url);
  }

  if (isFrameWhitelisted(page, frame))
    return true;

  var docDomain = extractHostFromFrame(frame);
  //console.log(docDomain);
  var filter = defaultMatcher.matchesAny(
    url,
    type == "sub_frame" ? "SUBDOCUMENT" : type.toUpperCase(),
    docDomain,
    isThirdParty(extractHostFromURL(url), docDomain)
  );

  // We can't listen to onHeadersReceived in Safari so we need to
  // check for notifications here
  if (platform != "chromium" && type == "sub_frame")
  {
    var notificationToShow = Notification.getNextToShow(url);
    if (notificationToShow)
      showNotification(notificationToShow);
  }

  FilterNotifier.triggerListeners("filter.hitCount", filter, 0, 0, page);
  //return !(filter instanceof BlockingFilter);
  return true;
}

ext.webRequest.onBeforeRequest.addListener(onBeforeRequest);

if (platform == "chromium")
{
  function onHeadersReceived(details)
  {
    if (details.tabId == -1)
      return;

    if (details.type != "main_frame" && details.type != "sub_frame")
      return;

    var page = new ext.Page({id: details.tabId});
    var frame = ext.getFrame(details.tabId, details.frameId);

    if (!frame || frame.url != details.url)
      return;

    for (var i = 0; i < details.responseHeaders.length; i++)
    {
      var header = details.responseHeaders[i];
      if (header.name.toLowerCase() == "x-adblock-key" && header.value)
        processKeyException(header.value, page, frame);
    }

    var notificationToShow = Notification.getNextToShow(details.url);
    if (notificationToShow)
      showNotification(notificationToShow);
  }

  chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, {urls: ["http://*/*", "https://*/*"]}, ["responseHeaders"]);
}
