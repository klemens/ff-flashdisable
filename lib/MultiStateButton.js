"use strict";

const {Cc, Ci} = require("chrome");
const system = require("sdk/system");

const VersionComparator = Cc["@mozilla.org/xpcom/version-comparator;1"].getService(Ci.nsIVersionComparator);
const australis = VersionComparator.compare(system.version, "29.0a2") >= 0;

/**
 * Wrapper class to manage a ui button that uses the new ActionButton in firefo 29+
 * and a widget in older versions
 *
 * @param id The id of the button
 * @param states An object with all states in the following format (australis comp):
 *               {
 *                   state1: {
 *                       label: "State 1",
 *                       icon: {
 *                           "16": data.url("icon_1_16.png"),
 *                           "32": data.url("icon_1_32.png")
 *                       }
 *                   },
 *                   state2: {
 *                       label: "State 2",
 *                       icon: data.url("icon_2.svg")
 *                   }
 *               }
 *               Each state has to have at least a label and a 16px icon.
 * @param initialState The initial state of the button
 */
function MultiStateButton(id, states, initialState) {
    if(australis) {
        this.buttonImpl = require("sdk/ui/button/action").ActionButton({
            id: id,
            label: states[initialState].label,
            icon: states[initialState].icon,
            onClick: () => {
                for(let observer of this.observers) {
                    observer(this.currentState);
                }
            }
        });
    } else {
        let icon = states[initialState].icon;
        this.buttonImpl = require("sdk/widget").Widget({
            id: id,
            label: states[initialState].label,
            tooltip: states[initialState].label,
            contentURL: typeof icon == "string" ? icon : icon["16"],
            onClick: () => {
                for(let observer of this.observers) {
                    observer(this.currentState);
                }
            }
        });
    }

    this.states = states;
    this.currentState = initialState;
    this.observers = [];
}

exports.MultiStateButton = MultiStateButton;
const MSBClass = MultiStateButton.prototype;

/**
 * Add a callback that is executed when the button is clicked. The current state is
 * passed as the first parameter
 */
MSBClass.onClick = function(callback) {
    this.observers.push(callback);
}

/**
 * Change the state of the button to the specified one
 */
MSBClass.changeState = function(newState) {
    if(australis) {
        this.buttonImpl.state(this.buttonImpl, this.states[newState]);
    } else {
        let icon = this.states[newState].icon;
        this.buttonImpl.tooltip = this.states[newState].label;
        this.buttonImpl.contentURL = typeof icon == "string" ? icon : icon["16"];
    }

    this.currentState = newState;
}
