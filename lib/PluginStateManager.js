"use strict";

const {Cc, Ci} = require("chrome");
const Pref = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);

// load plugin state preference branch
const PluginStates = Pref.getBranch("plugin.state.");

// safe the instances for unregistering on unload
let instances = [];

/**
 * Small class to manage the global enabled/disabled/click_to_play state of a plugin
 *
 * @param plugin String internal name of the plugin, eg "flash"
 */
function PluginStateManager(plugin) {
    this.pluginName = plugin;
    PluginStates.addObserver("", this, false);
    this.currentValue = this.getState();

    this.observers = [];
    instances.push(this);
}

// export class
exports.PluginStateManager = PluginStateManager;
const PSMClass = PluginStateManager.prototype;

// expose the state constants to the user of this class
PluginStateManager.UNKNOWN = -1;
PluginStateManager.ENABLED = Ci.nsIPluginTag.STATE_ENABLED;
PluginStateManager.DISABLED = Ci.nsIPluginTag.STATE_DISABLED;
PluginStateManager.CLICK_TO_PLAY = Ci.nsIPluginTag.STATE_CLICKTOPLAY;

/**
 * Returns the current state of the plugin
 *
 * @return UNKNOWN if the plugin was not found and one of ENABLED, DISABLED,
 *         CLICK_TO_PLAY otherwise
 */
PSMClass.getState = function() {
    let state = PluginStateManager.UNKNOWN;
    try {
        state = PluginStates.getIntPref(this.pluginName);
    } catch(e) {}
    return state;
}

/**
 * Sets the state of the plugin
 *
 * @return true if the state was changed, false if the plugin was not found
 * @see getState()
 */
PSMClass.setState = function(state) {
    if(state != PluginStateManager.ENABLED &&
       state != PluginStateManager.DISABLED &&
       state != PluginStateManager.CLICK_TO_PLAY) {
        throw new TypeError("specify a proper state!");
    }

    PluginStates.setIntPref(this.pluginName, state);
    return true;
}

/**
 * Add a callback that gets called when the plugin state changes.
 * The callback gets called with the new value as its first argument and the old
 * one as its second argument (if available, UNKNOWN otherwise)
 * @param trigger if set to true, the callback is called with the current value
 *                as new and old value (optional)
 */
PSMClass.onChange = function(callback, trigger) {
    this.observers.push(callback);
    if(trigger) {
        callback(this.currentValue, this.currentValue);
    }
}

/**
 * Callback for the preference observer that calls all registered callbacks
 */
PSMClass.observe = function(branch, event, pref) {
    if(event == "nsPref:changed" && pref == this.pluginName) {
        let newValue = branch.getIntPref(pref);
        for(let observer of this.observers) {
            observer(newValue, this.currentValue);
        }
        this.currentValue = newValue;
    }
}

/**
 * Remove all preference observers on unload
 */
require("sdk/system/unload").when(() => {
    for(let instance of instances) {
        PluginStates.removeObserver("", instance);
    }
    instances = [];
});
