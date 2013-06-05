const {Cu} = require('chrome');
var self = require('self');
var notifications = require("notifications");
var simplePrefs = require("simple-prefs");
var AddonManager = Cu.import("resource://gre/modules/AddonManager.jsm").AddonManager;

var flashName = simplePrefs.prefs.flashName;

simplePrefs.on("flashName", function(name) {
    flashName = simplePrefs.prefs.flashName;
});

function flashEnabled(callback) {
    AddonManager.getAddonsByTypes(["plugin"], function(addons) {
        for (let i = 0; i < addons.length; i++) {
            if (addons[i].name == flashName) {
                callback(!addons[i].userDisabled);
                break;
            }
        }
    });
}

function flashToggle() {
    AddonManager.getAddonsByTypes(["plugin"], function(addons) {
        for (let i = 0; i < addons.length; i++) {
            if (addons[i].name == flashName) {
                addons[i].userDisabled = !addons[i].userDisabled;
                return;
            }
        }
        notifications.notify({
            title: "Flash could not be found.",
            text: "Adjust Flash plugin name",
            iconURL: self.data.url("applogo32.png"),
            onClick: function(data) {
                require('window-utils').activeBrowserWindow.BrowserOpenAddonsMgr("addons://detail/" + self.id);
            }
        });
    });
}


// the button id
fdID = 'flash-disable-button44';

// import the two icons
flashIcon = self.data.url("logo.ico");
flashIconDisabled = self.data.url("logo_bw.ico");

// create the button to toggle flash
var flashToggleButton = require("toolbarbutton").ToolbarButton({
    id: fdID,
    label: "Toggle Flash",
    image: flashIconDisabled,
    onCommand: function () {
        flashToggle();
    }
});

var flashEventListener = {
    onDisabled: function(addon) {
        if(addon.name == flashName) {
            flashToggleButton.setIcon(flashIconDisabled);
            flashToggleButton.setTooltip('Enable Flash');
        }
        
    },
    onEnabled: function(addon) {
        if(addon.name == flashName) {
            flashToggleButton.setIcon(flashIcon);
            flashToggleButton.setTooltip('Disable Flash');
        }
    }
};

exports.main = function(options, callback) {
    if (options.loadReason == "install") {
        flashToggleButton.moveTo({
            toolbarID: 'nav-bar',
            forceMove: false // only move from palette
        });
    }
    
    flashEnabled(function(enabled) {
        flashToggleButton.setIcon(enabled ? flashIcon : flashIconDisabled);
    });
    
    AddonManager.addAddonListener(flashEventListener);
};

exports.onUnload = function(reason) {
    AddonManager.removeAddonListener(flashEventListener);
    
    flashToggleButton.destroy();
}
