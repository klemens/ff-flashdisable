var self = require("sdk/self");
var simplePrefs = require("sdk/simple-prefs");
var tabs = require("sdk/tabs");
var system = require("sdk/system");

const {Cc, Ci, Cr, Cu} = require('chrome');

var AddonManager = Cu.import("resource://gre/modules/AddonManager.jsm").AddonManager;
var PluginHost = Cc["@mozilla.org/plugin/host;1"].getService(Ci.nsIPluginHost);
var VersionComparator = Cc["@mozilla.org/xpcom/version-comparator;1"].getService(Ci.nsIVersionComparator);

const {MultiStateButton} = require("./MultiStateButton");

// The interface has changed in Firefox 23 alpha
var useNewApi = VersionComparator.compare(system.version, "23.0a1") >= 0;

// load the name of the flash plugin from addon settings
const flashName = "Shockwave Flash";
var autoreload = simplePrefs.prefs.autoreload;
var disableOnStartup = simplePrefs.prefs.disableOnStartup;

// the button id
const buttonId = 'flash-disable-button';

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

                return;
            } else {
                if(plugins[i].disabled)
                    callback("disabled");
                else
                    callback("enabled");

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

// callback to set the proper icon
function flashEnabledCallback(status) {
    switch(status) {
        case "enabled":
            button.changeState("enabled");
            break;
        case "disabled":
            button.changeState("disabled");
            break;
        case "notfound":
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
    onPrefAutoreload:
        function(name) {
            autoreload = simplePrefs.prefs.autoreload;
        },
    onPrefDisableOnStartup:
        function(name) {
            disableOnStartup = simplePrefs.prefs.disableOnStartup;
        }
}

const buttonStates =  {
    logo: {
        label: "FlashDisable",
        icon: self.data.url("logo.svg")
    },
    enabled: {
        label: "Disable Flash",
        icon: self.data.url("button_enabled.svg")
    },
    disabled: {
        label: "Enable Flash",
        icon: self.data.url("button_disabled.svg")
    }
};

const button = new MultiStateButton(buttonId, buttonStates, "logo");

exports.main = function(options, callback) {
    // disable flash on startup if setting is on
    if(disableOnStartup && options.loadReason == "startup") {
        flashDisable();
    }

    // toggle flash state on button click
    button.onClick(state => {
        flashToggle(function(){});
        if("disabled" == state) {
            button.changeState("enabled");
            if(autoreload) {
                tabs.activeTab.reload();
            }
        } else {
            button.changeState("disabled");
        }
    });

    // load initial state of flash plugin
    flashEnabled(flashEnabledCallback);

    // listen to addon enable and disable events
    AddonManager.addAddonListener(listeners.onAddonChange);

    // listen to changes of the flash plugin name through the addon settings
    simplePrefs.on("autoreload", listeners.onPrefAutoreload);
    simplePrefs.on("disableOnStartup", listeners.onPrefDisableOnStartup);
};

exports.onUnload = function(reason) {
    // remove Listeners
    simplePrefs.removeListener("autoreload", listeners.onPrefAutoreload);
    simplePrefs.removeListener("disableOnStartup", listeners.onPrefDisableOnStartup);
    AddonManager.removeAddonListener(listeners.onAddonChange);
}
