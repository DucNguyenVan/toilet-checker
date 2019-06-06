

function onInit() {
  console.log('onInit');
  localStorage.toiletStatus = false;
  startRequest({scheduleRequest:true, showLoadingAnimation:true});
  chrome.alarms.create('refresh', {periodInMinutes:1});
}

function onAlarm(alarm) {
  console.log('Got alarm', alarm);
  chrome.alarms.get('refresh', function(alarm) {
    if (alarm) {
      console.log('Refresh alarm exists. Yay.');
    } else {
      console.log('Refresh alarm doesn\'t exist!? ' +
                  'Refreshing now and rescheduling.');
    startRequest({scheduleRequest:true});
    }
  });
}

chrome.runtime.onInstalled.addListener(onInit);

chrome.alarms.onAlarm.addListener(onAlarm);


function startRequest(params) {
  getToiletStatus(
    function(status) {
      console.log(status);
      localStorage.toiletStatus = status
      updateToiletStatus(status);
    },
    function() {
      console.log("failed!");
    }
  );
}

function getToiletStatus(onSuccess, onError) {
  var xhr = new XMLHttpRequest();
  var abortTimerId = window.setTimeout(function() {
    xhr.abort();  // synchronously calls onreadystatechange
  }, 2000);

  function handleSuccess(status) {
    window.clearTimeout(2000);
    if (onSuccess)
      onSuccess(status);
  }

  var invokedErrorCallback = false;
  function handleError() {
    window.clearTimeout(2000);
    if (onError && !invokedErrorCallback)
      onError();
    invokedErrorCallback = true;
  }

  try {
    xhr.onreadystatechange = function() {
      if (xhr.readyState != 4)
        return;

      if (xhr.responseText) {
        var res = JSON.parse(xhr.responseText);
        var toiletStatus = Object.values(res)[0]["status"];
        if (toiletStatus) {
          handleSuccess(toiletStatus);
          return;
        } else {
          console.error("get data failed");
        }
      }
      handleError();
    };

    xhr.onerror = function(error) {
      handleError();
    };

    xhr.open("GET", getFeedUrl(), true);
    xhr.send(null);
  } catch(e) {
    handleError();
  }
}

function getFeedUrl() {
  return "https://basic-f1d1a.firebaseio.com/2f_man_toilet/1.json?orderBy=%22timestamp%22&limitToLast=1";
}

function updateToiletStatus() {
  if (localStorage.toiletStatus == "open"){
    chrome.browserAction.setIcon({path:"images/toilet_enable.png"});
    chrome.browserAction.setBadgeBackgroundColor({color:[208, 0, 24, 255]});
    chrome.browserAction.setBadgeText({text:"ON"});
  }
  else {
    chrome.browserAction.setIcon({path:"images/toilet_disable.png"});
    chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
    chrome.browserAction.setBadgeText({text:"OFF"});
  }
}
