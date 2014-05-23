var self = require("sdk/self");
var simplePrefs = require("sdk/simple-prefs");
var tabs = require("sdk/tabs");

const {MultiStateButton} = require("./MultiStateButton");
const {PluginStateManager} = require("./PluginStateManager");

// load the name of the flash plugin from addon settings
var autoreload = simplePrefs.prefs.autoreload;
var disableOnStartup = simplePrefs.prefs.disableOnStartup;

// the button id
const buttonId = 'flash-disable-button';

// keep all the listeners external so we can remove them on unload
var listeners = {
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
const flash = new PluginStateManager("flash");

exports.main = function(options, callback) {
    // disable flash on startup if setting is on
    if(disableOnStartup && options.loadReason == "startup") {
        flash.setState(PluginStateManager.DISABLED);
    }

    // toggle flash state on button click
    button.onClick(currentState => {
        if("disabled" == currentState) {
            flash.setState(PluginStateManager.ENABLED);
            if(autoreload) {
                tabs.activeTab.reload();
            }
        } else {
            flash.setState(PluginStateManager.DISABLED);
        }
    });

    // change button if flash state changes and set initial state of button (true)
    flash.onChange((newState, oldState) => {
        if(newState == PluginStateManager.DISABLED) {
            button.changeState("disabled");
        } else { // includes enabled and click_to_play
            button.changeState("enabled");
        }
    }, true);

    // listen to changes of the flash plugin name through the addon settings
    simplePrefs.on("autoreload", listeners.onPrefAutoreload);
    simplePrefs.on("disableOnStartup", listeners.onPrefDisableOnStartup);
};

exports.onUnload = function(reason) {
    // remove Listeners
    simplePrefs.removeListener("autoreload", listeners.onPrefAutoreload);
    simplePrefs.removeListener("disableOnStartup", listeners.onPrefDisableOnStartup);
}
