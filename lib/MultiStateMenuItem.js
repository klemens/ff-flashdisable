"use strict";

const {Menuitem} = require("menuitems");

/**
 * Wrapper class to manage a menuitem with multiple states.
 *
 * @param id The id of the menu item
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
 *               Each state has to have at least a label and a 16px (or svg) icon.
 * @param initialState The initial state of the menu item
 */
function MultiStateMenuItem(id, states, initialState) {
    let icon = states[initialState].icon;
    this.menuItemImpl = Menuitem({
        id: id,
        menuid: "menu_ToolsPopup",
        insertbefore: "prefSep",
        label: states[initialState].label,
        image: typeof icon == "string" ? icon : icon["16"],
        onCommand: () => {
            for(let observer of this.observers) {
                observer(this.currentState);
            }
        }
    });

    this.states = states;
    this.currentState = initialState;
    this.observers = [];
}

exports.MultiStateMenuItem = MultiStateMenuItem;
const MSMIClass = MultiStateMenuItem.prototype;

/**
 * Add a callback that is executed when the button is clicked. The current state is
 * passed as the first parameter
 */
MSMIClass.onClick = function(callback) {
    this.observers.push(callback);
}

/**
 * Change the state of the button to the specified one
 */
MSMIClass.changeState = function(newState) {
    let icon = this.states[newState].icon;
    this.menuItemImpl.label = this.states[newState].label;
    this.menuItemImpl.image = typeof icon == "string" ? icon : icon["16"];

    this.currentState = newState;
}
