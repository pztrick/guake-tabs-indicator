// A tabbed interface extension for Gnome-shell \
//    that fetches terminal sessions from Guake Terminal
//
// Copyright (C) 2013 Patrick Paul, Gnome-shell extension contributors
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

// My constants
const IS_ACTIVE = true, IS_INACTIVE = false;
const LOOP_TIMEOUT = 300;

// My imports
const Mainloop = imports.mainloop;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const Lang = imports.lang;
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;

// DBus interface
const Me = imports.misc.extensionUtils.getCurrentExtension();
const DBusIface = Me.imports.dbus;

// My variables
let guake_tabs, proxy, mainloop_subloop;


// This is button/label for one terminal session tab
var GuakeTabButton = new Lang.Class({
    Name: 'GuakeTabsButton',
    Extends: PanelMenu.Button,

    _init: function(tab_index) {
      this.parent();  // 2013/5/18 - Not sure if this is needed / not familiar with gjs

      this.actor = new St.Button();
      this.tab_index = tab_index;
      this.hover = false;
      this.modify_state(IS_INACTIVE);

      this.actor.connect('button-press-event', Lang.bind(this, this._openTab));

      this.actor.connect('enter-event', Lang.bind(this, this._onEnterEvent));
      this.actor.connect('leave-event', Lang.bind(this, this._onLeaveEvent));
    },

    modify_state: function(is_selected_tab) {
      if (is_selected_tab) {
        this.css_style = 'extension-guaketabs-active';
      } else {
        this.css_style = 'extension-guaketabs-inactive';
      }
      this._redraw_label();
    },

    _get_label_text: function() {
      // The default tab name is the VTE prompt (e.g. "patrick@medina: ~")

      // This is wrapped in try/catch because get_tab_name(index) can fail 
      // if user has closed tab in guake before we've had a chance to delete button
      try {
        let tab_name;
        [tab_name, err] = proxy.get_tab_nameSync(this.tab_index);
        return " [" + (this.tab_index + 1).toString() + "] " + tab_name.toString();
      } catch (err) {
        return " [" + (this.tab_index + 1).toString() + "] "
      }
    },

    _redraw_label: function() {
      let css_classes = this.css_style;
      if (this.hover) {
        css_classes = this.css_style + '-' + 'hover';
      }

      if (!this.label) {
        this.label = new St.Label();
      }
      this.label.style_class = css_classes;
      this.label.set_text(this._get_label_text());
      this.actor.add_actor(this.label);
    },

    _openTab: function(actor, event){
      proxy.select_tabRemote(parseInt(this.tab_index));
      proxy.showRemote();
      redraw_tabs();
    },

    _onEnterEvent: function(actor, event){
      this.hover = true;
      this._redraw_label();
    },

    _onLeaveEvent: function(actor, event){
      this.hover = false;
      this._redraw_label();
    }
});

function redraw_tabs() {
  // Step 1) Add or remove tab indicators to match Guake
  let our_next_tab_index, their_last_tab_index;
  our_next_tab_index = guake_tabs.length;
  [their_last_tab_index, err] = proxy.get_tab_countSync();
  their_last_tab_index = their_last_tab_index - 1;
    // Case 1) Do we have fewer tabs than Guake has terminals?
  for (var i=our_next_tab_index; i <= their_last_tab_index; i++) {
      let new_tab = new GuakeTabButton(i);
      guake_tabs.push(new_tab);
      Main.panel._centerBox.add(new_tab.actor);
  }
    // Case 2) Do we have more tabs than Guake has terminals?
  for (var i=our_next_tab_index; i > their_last_tab_index + 1; i--) {
      closed_tab = guake_tabs.pop();
      closed_tab.destroy();
  }

  // Step 2) Style tab indicators
    // Draw all tabs as INACTIVE style
  for (var i=0; i<guake_tabs.length;i++) {
    guake_tabs[i].modify_state(IS_INACTIVE);
  }
    // Get the selected tab and style it as ACTIVE
  [selected_tab_index, err] = proxy.get_selected_tabSync();
  guake_tabs[selected_tab_index].modify_state(IS_ACTIVE);
  // Step 3) Return true to ensure function continues looping from Mainloop.timeout callback
  return true;
}

function init(metadata) {
    // ...
}

function enable() {
    proxy = new DBusIface.GuakeProxy();
    guake_tabs = new Array();
    mainloop_subloop = Mainloop.timeout_add(LOOP_TIMEOUT, redraw_tabs);
}

function disable() {
    if (guake_tabs) {
      for each (tab in guake_tabs){
        tab.destroy();
      }
    }
    Mainloop.source_remove(mainloop_subloop);
    guake_tabs = null;
    proxy = null;
}
