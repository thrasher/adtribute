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

function onHeadersReceived(details) {
  //console.log(JSON.stringify(details));
  for(var key in details.responseHeaders) {
    if (details.responseHeaders.hasOwnProperty(key)) {
      //console.log(key + " = " + JSON.stringify(details.responseHeaders[key]));
      var header = details.responseHeaders[key];
      if (header.name.toLowerCase() == "content-type") {
        if (/video.*/.test(header.value)) {
          console.log(JSON.stringify(header) + " " + details.url);
        }        
      }
    }
  }
}
chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived,
 {urls:["http://*/*", "https://*/*"]}, ["blocking","responseHeaders"]);

// http://tools.btrll.com/wiki/Testing_RTBD_end-to-end_on_Stage#Testing
// http://test.btrll.com/vast_monster?vast_url=http%3A%2F%2Fvast.bp3850308.btrll.com%2Fvast%2F3850308&content_vid=http%3A%2F%2Famscdn.btrll.com%2Fproduction%2F5798%2Fbrvideo.flv&w=300&h=250&autostart=on
// https://github.com/prasmussen/chrome-cli
// brew install chrome-cli

var platform ={};
platform['brightroll'] = {
  "handle": "brightroll",
  "brand" : "BrightRoll Platform",
  "logo" : "icons/abp-48.png",
  "lifecycle" : {
      "player" : new RegExp('.*cache.btrll.com/jwplayer/.*','ig'),
      "decision" : new RegExp('vast.*.btrll.com','ig'),
      "video" : new RegExp('.*brxcdn.*.btrll.com/production/.*(flv|mpeg|mpg|mov|mp4|webm)','ig'),
      "companion" : new RegExp('.*brxcdn.*.btrll.com/production/.*(jpg|jpeg|png|gif)','ig'),
      "metrics" : new RegExp('brxserv.*.btrll.com','ig')
    }
  };
//http://r12---sn-a5m7lner.c.2mdn.net/videoplayback/id/06fd7765f7b33ba1
platform['adx'] = {
  "handle": "adx",
  "brand" : "DoubleClick Ad Exchange",
  "logo" : "icons/doubleclick_adexchange_logo.gif",
  "lifecycle" : {
      "player" : "",
      "decision" : "",
      "video" : new RegExp('.*2mdn.net/videoplayback/.*(flv|mpeg|mpg|mov|mp4|webm)','ig'),
      "companion" : "",
      "metrics" : ""
    }
  };
// scanscout is purchased by tremor in 2010
// http://static.scanscout.com/filemanager/vhs/partner350101_2bb3689d-c0aa-434b-8893-5e085ad5a4fc.mp4 
platform['tremor'] = {
  "handle": "tremor",
  "brand" : "Tremor Video",
  "logo" : "icons/tremorvideo_logo.png",
  "lifecycle" : {
      "player" : "",
      "decision" : "",
      "video" : new RegExp('.*scanscout.com/.*(flv|mpeg|mpg|mov|mp4|webm)','ig'),
      "companion" : "",
      "metrics" : ""
    }
  };

//Sizmek_Logo_CMYK_Transparent.png
// serving-sys owned by sizmek
// aka Ilissos Eyeblaster
// http://ds.serving-sys.com/BurstingRes/Site-39147/Type-16/d3185e43-d699-4d89-8b83-8f4e38fbf59d.mp4
platform['sizmek'] = {
  "handle": "sizmek",
  "brand" : "Sizmek (MediaMind)",
  "logo" : "icons/Sizmek_Logo_CMYK_Transparent.png",
  "lifecycle" : {
      "player" : "",
      "decision" : "",
      "video" : new RegExp('.*serving-sys.com/.*(flv|mpeg|mpg|mov|mp4|webm)','ig'),
      "companion" : "",
      "metrics" : ""
    }
  };
// http://vindicoasset.edgesuite.net/Repository/CampaignCreative/Campaign_19346/INSTREAMAD/fy15_crabfest%2015_us_YDRR1226000H_PreRoll_640x360_16-9.flv
platform['vindico'] = {
  "handle": "vindico",
  "brand" : "Vindico",
  "logo" : "icons/vindico.png",
  "lifecycle" : {
      "player" : "",
      "decision" : "",
      "video" : new RegExp('.*vindico.*(flv|mpeg|mpg|mov|mp4|webm)'),
      "companion" : "",
      "metrics" : ""
    }
  };

function notifyAdtribution(platform, url) {
  var msg = "Adtribution: " + platform.brand;
  var noti = chrome.notifications.create(
    'name-for-notification',{   
    'type': 'basic', 
    'iconUrl': platform.logo, 
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
  // console.log("url "+url + " type "+type +" page "+page+ " frame "+frame);

  if (new RegExp('.*(flv|mpeg|mpg|mov|mp4).*','ig').test(url)) {
    //console.log("video: "+url);
  }

  for (var handle in platform) {
    var p = platform[handle];
    if (p.lifecycle.video.test(url)) {
      notifyAdtribution(p, url);
    }
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


