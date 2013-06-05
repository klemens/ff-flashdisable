var self = require("self");
var notifications = require("notifications");
var simplePrefs = require("simple-prefs");
var tabs = require("tabs");

const {Cc, Ci, Cr, Cu} = require('chrome');

var AddonManager = Cu.import("resource://gre/modules/AddonManager.jsm").AddonManager;
var PluginHost = Cc["@mozilla.org/plugin/host;1"].getService(Ci.nsIPluginHost);


// load the name of the flash plugin from addon settings
var flashName = simplePrefs.prefs.flashName;
var autoreload = simplePrefs.prefs.autoreload;

//save last status for auto reload
var lastStatus = -1;

// the button id
fdID = 'flash-disable-button44';

// import the two icons
flashIcon = self.data.url("logo.ico");
flashIconDisabled = self.data.url("logo_bw.ico");
flashIconNotFound = self.data.url("logo_nf.ico");
addonIcon = self.data.url("applogo32.png");


function flashEnabled(callback) {
    let plugins = PluginHost.getPluginTags({});
        
    for (let i = 0; i < plugins.length; i++) {
        if(plugins[i].name == flashName) {
            if(plugins[i].disabled)
                callback("disabled");
            else
                callback("enabled");
            
            lastStatus = plugins[i].disabled ? 0 : 1;
            
            return;
        }
    }
    
    callback("notfound");
    
    /* see below
    AddonManager.getAddonsByTypes(["plugin"], function(addons) {
        for (let i = 0; i < addons.length; i++) {
            if (addons[i].name == flashName) {
                if(addons[i].userDisabled)
                    callback("disabled");
                else
                    callback("enabled");
                return;
            }
        }
        callback("notfound");
    });
    */
}

function flashToggle(notfound) {
    let plugins = PluginHost.getPluginTags({});
        
    for (let i = 0; i < plugins.length; i++) {
        if(plugins[i].name == flashName) {
            plugins[i].disabled = !plugins[i].disabled;
            return;
        }
    }
    
    notfound();
    
    /* This solution is not working currently:
       The userDisabled property does not work properly with the flash addon:
       If you disable it using userDisabled, you cannot reenable it until you
       restart firefox several times.    
    
    AddonManager.getAddonsByTypes(["plugin"], function(addons) {
        for (let i = 0; i < addons.length; i++) {
            if (addons[i].name == flashName) {
                addons[i].userDisabled = !addons[i].userDisabled;
                return;
            }
        }
        notfound();
    });
    */
}

// create the button to toggle flash
var flashToggleButton = require("toolbarbutton").ToolbarButton({
    id: fdID,
    label: "FlashDisable",
    tooltip: "Flash could not be found",
    image: flashIconNotFound,
    onCommand: function () {
        flashToggle(function() {
            notifications.notify({
                title: "Flash could not be found",
                text: "Adjust Flash plugin name",
                iconURL: addonIcon,
                onClick: function(data) {
                    require('window-utils').activeBrowserWindow.BrowserOpenAddonsMgr("addons://detail/" + self.id);
                }
            });
        });
        // syncronous because of the reason mentioned above
        flashEnabled(flashEnabledCallback);
        //reload after plugin activated
        if(autoreload && lastStatus == 1)
            tabs.activeTab.reload();
    },
    onToolbar: function() {
        flashEnabled(flashEnabledCallback);
    }
});


function flashEnabledCallback(status) {
    switch(status) {
        case "enabled":
            flashToggleButton.setIcon(flashIcon);
            flashToggleButton.setTooltip("Disable Flash");
            break;
        case "disabled":
            flashToggleButton.setIcon(flashIconDisabled);
            flashToggleButton.setTooltip("Enable Flash");
            break;
        case "notfound":
            flashToggleButton.setIcon(flashIconNotFound);
            flashToggleButton.setTooltip("Flash could not be found");
            break;
    }
};

var flashEventListener = {
    onDisabled: function(addon) {
        if(addon.name == flashName) {
            flashEnabledCallback("disabled");
        }
    },
    onEnabled: function(addon) {
        if(addon.name == flashName) {
            flashEnabledCallback("enabled");
        }
    }
};


exports.main = function(options, callback) {

    // move the button to the navigation toolbar after isntallation
    if (options.loadReason == "install") {
        flashToggleButton.moveTo({
            toolbarID: 'nav-bar',
            forceMove: false // only move from palette
        });
    }
    
    // load initial state of flash plugin
    flashEnabled(flashEnabledCallback);
    
    // listen to addon enable and disable events
    AddonManager.addAddonListener(flashEventListener);
    
    // listen to changes of the flash plugin name through the addon settings
    simplePrefs.on("flashName", function(name) {
        flashName = simplePrefs.prefs.flashName;
        flashEnabled(flashEnabledCallback);
    });
    simplePrefs.on("autoreload", function(name) {
        autoreload = simplePrefs.prefs.autoreload;
    });
};

exports.onUnload = function(reason) {
    AddonManager.removeAddonListener(flashEventListener);
    
    flashToggleButton.destroy();
}
