var self = require("sdk/self");
var notifications = require("sdk/notifications");
var simplePrefs = require("sdk/simple-prefs");
var tabs = require("sdk/tabs");
var system = require("sdk/system");

const {Cc, Ci, Cr, Cu} = require('chrome');

var AddonManager = Cu.import("resource://gre/modules/AddonManager.jsm").AddonManager;
var PluginHost = Cc["@mozilla.org/plugin/host;1"].getService(Ci.nsIPluginHost);
var VersionComparator = Cc["@mozilla.org/xpcom/version-comparator;1"].getService(Ci.nsIVersionComparator);

// The interface has changed in Firefox 23 alpha
var useNewApi = VersionComparator.compare(system.version, "23.0a1") >= 0;

// load the name of the flash plugin from addon settings
var flashName = simplePrefs.prefs.flashName;
var autoreload = simplePrefs.prefs.autoreload;
var disableOnStartup = simplePrefs.prefs.disableOnStartup;

// save last status for auto reload
var lastStatus = -1;

// the button id
fdID = 'flash-disable-button44';

// import the two icons
flashIcon = self.data.url("logo.ico");
flashIconDisabled = self.data.url("logo_bw.ico");
flashIconNotFound = self.data.url("logo_nf.ico");
addonIcon = self.data.url("applogo32.png");

// checks if flash in enabled
function flashEnabled(callback) {
    let plugins = PluginHost.getPluginTags({});
        
    for (let i = 0; i < plugins.length; i++) {
        if(plugins[i].name == flashName) {
            if(useNewApi) {
                if(plugins[i].enabledState == Ci.nsIPluginTag.STATE_DISABLED)
                    callback("disabled");
                else
                    callback("enabled");
                
                lastStatus = plugins[i].enabledState == Ci.nsIPluginTag.STATE_DISABLED ? 0 : 1;
                
                return;
            } else {
                if(plugins[i].disabled)
                    callback("disabled");
                else
                    callback("enabled");
                
                lastStatus = plugins[i].disabled ? 0 : 1;
                
                return;
            }
        }
    }
    
    callback("notfound");
}

// toggle the enabled status of flash
function flashToggle(callback) {
    let plugins = PluginHost.getPluginTags({});
        
    for (let i = 0; i < plugins.length; i++) {
        if(plugins[i].name == flashName) {
            if(useNewApi) {
                if(plugins[i].enabledState == Ci.nsIPluginTag.STATE_DISABLED)
                    plugins[i].enabledState = Ci.nsIPluginTag.STATE_ENABLED;
                else
                    plugins[i].enabledState = Ci.nsIPluginTag.STATE_DISABLED;
                return;
            } else {
                plugins[i].disabled = !plugins[i].disabled;
                return;
            }
        }
    }
    
    callback("notfound");
}

// disable flash
function flashDisable() {
    let plugins = PluginHost.getPluginTags({});
        
    for (let i = 0; i < plugins.length; i++) {
        if(plugins[i].name == flashName) {
            if(useNewApi) {
                plugins[i].enabledState = Ci.nsIPluginTag.STATE_DISABLED;
                return;
            } else {
                plugins[i].disabled = true;
                return;
            }
        }
    }
}

// create the button to toggle flash
var flashToggleButton = require("toolbarbutton").ToolbarButton({
    id: fdID,
    label: "FlashDisable",
    tooltip: "Flash could not be found",
    image: flashIconNotFound,
    onCommand: function () {
        flashToggle(function(status) {
            if("notfound" == status) {
                notifications.notify({
                    title: "Flash could not be found",
                    text: "Adjust Flash plugin name",
                    iconURL: addonIcon,
                    onClick: function(data) {
                        require('window-utils').activeBrowserWindow.BrowserOpenAddonsMgr("addons://detail/" + self.id);
                    }
                });
            }
        });
        
        flashEnabled(flashEnabledCallback);
        
        //reload after plugin activated
        if(autoreload && lastStatus == 1)
            tabs.activeTab.reload();
    },
    onToolbar: function() {
        flashEnabled(flashEnabledCallback);
    }
});

// callback to set the proper icon
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

// keep all the listeners external so we can remove them on unload
var listeners = {
    onAddonChange:
        {
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
        },
    onPrefFlashName:
        function(name) {
            flashName = simplePrefs.prefs.flashName;
            flashEnabled(flashEnabledCallback);
        },
    onPrefAutoreload:
        function(name) {
            autoreload = simplePrefs.prefs.autoreload;
        },
    onPrefDisableOnStartup:
        function(name) {
            disableOnStartup = simplePrefs.prefs.disableOnStartup;
        },
    onMoveButton:
        function(name) {
            flashToggleButton.moveTo({
                toolbarID: 'nav-bar',
                forceMove: true
            });
            flashEnabled(flashEnabledCallback);
        }
}


exports.main = function(options, callback) {
    // move the button to the navigation toolbar after isntallation
    if (options.loadReason == "install") {
        flashToggleButton.moveTo({
            toolbarID: 'nav-bar',
            forceMove: false // only move from palette
        });
    }
    
    // disable flash on startup if setting is on
    if(disableOnStartup && options.loadReason == "startup") {
        flashDisable();
    }
    
    // load initial state of flash plugin
    flashEnabled(flashEnabledCallback);
    
    // listen to addon enable and disable events
    AddonManager.addAddonListener(listeners.onAddonChange);
    
    // listen to changes of the flash plugin name through the addon settings
    simplePrefs.on("flashName", listeners.onPrefFlashName);
    simplePrefs.on("autoreload", listeners.onPrefAutoreload);
    simplePrefs.on("disableOnStartup", listeners.onPrefDisableOnStartup);
    simplePrefs.on("moveButton", listeners.onMoveButton);
};

exports.onUnload = function(reason) {
    // remove Listeners
    simplePrefs.removeListener("flashName", listeners.onPrefFlashName);
    simplePrefs.removeListener("autoreload", listeners.onPrefAutoreload);
    simplePrefs.removeListener("disableOnStartup", listeners.onPrefDisableOnStartup);
    simplePrefs.removeListener("moveButton", listeners.onMoveButton);
    AddonManager.removeAddonListener(listeners.onAddonChange);
    
    // destroy button
    flashToggleButton.destroy();
}
