const Gio = imports.gi.Gio;
const Lang = imports.lang;

const GuakeIface = <interface name="org.guake.RemoteControl">
<method name="quit"/>
<method name="show_about"/>
<method name="rename_current_tab">
    <arg type="s" direction="in" name="name"/>
</method>
<method name="execute_command">
    <arg type="s" direction="in" name="command"/>
</method>
<method name="show_prefs"/>
<method name="show"/>
<method name="hide"/>
<method name="show_hide"/>
<method name="get_tab_name">
    <arg type="i" direction="in" name="tab_index"/>
    <arg type="s" direction="out" name="tab_name"/>
</method>
<method name="get_selected_tab">
    <arg type="i" direction="out" name="tab_index"/>
</method>
<method name="get_tab_count">
    <arg type="i" direction="out" name="tab_count"/>
</method>
<method name="add_tab">
    <arg type="s" direction="in" name="directory"/>
</method>
<method name="select_tab">
    <arg type="i" direction="in" name="tab_index"/>
</method>
</interface>;

let GuakeProxyWrapper = Gio.DBusProxy.makeProxyWrapper(GuakeIface);

function GuakeProxy() {
	return new GuakeProxyWrapper(Gio.DBus.session, 'org.guake.RemoteControl', '/org/guake/RemoteControl');
}