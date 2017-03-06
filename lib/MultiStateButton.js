"use strict";

/**
 * Wrapper class to manage a ui button that uses the sdk ActionButton
 *
 * @param id The id of the button
 * @param states An object with all states in the following format:
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
    this.buttonImpl.state(this.buttonImpl, this.states[newState]);

    this.currentState = newState;
}
