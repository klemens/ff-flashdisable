const {Cu} = require('chrome');
var self = require('self');
var AddonManager = Cu.import("resource://gre/modules/AddonManager.jsm").AddonManager;

function flashEnabled(callback) {
    AddonManager.getAddonsByTypes(["plugin"], function(addons) {
        for (let i = 0; i < addons.length; i++) {
            if (addons[i].name == "Shockwave Flash") {
                callback(!addons[i].userDisabled);
                break;
            }
        }
    });
}

function flashToggle() {
    AddonManager.getAddonsByTypes(["plugin"], function(addons) {
        for (let i = 0; i < addons.length; i++) {
            if (addons[i].name == "Shockwave Flash") {
                addons[i].userDisabled = !addons[i].userDisabled;
            }
        }
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
    image: flashIcon,
    onCommand: function () {
        flashToggle(); // this toggles the falsh status
    }
});

function setIcon(enabled) {
    flashToggleButton.setIcon(enabled ? flashIcon : flashIconDisabled);
}

var flashEventListener = {
    onDisabled: function(addon) {
        if(addon.name == 'Shockwave Flash') {
            setIcon(false);
            flashToggleButton.setTooltip('Enable Flash');
            console.log('FlashDisable: ' + addon.name + ' disabled');
        }
        
    },
    onEnabled: function(addon) {
        if(addon.name == 'Shockwave Flash') {
            setIcon(true);
            flashToggleButton.setTooltip('Disable Flash');
            console.log('FlashDisable: ' + addon.name + ' enabled');
        }
    }
};

exports.main = function(options, callback) {
    // show button in toolbar after installation
    // todo: only show after installation
    // this does not work with addon kit 1.8, options.loadReason is alwasy undefined
    // have to wait for 1.8.1
    flashToggleButton.moveTo({
        toolbarID: 'nav-bar',
        forceMove: false // only move from palette
    });
    
    flashEnabled(setIcon);
    
    AddonManager.addAddonListener(flashEventListener);
};

exports.onUnload = function(reason) {
    AddonManager.removeAddonListener(flashEventListener);
}
