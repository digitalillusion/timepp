const Gio            = imports.gi.Gio;
const Gtk            = imports.gi.Gtk;
const GLib           = imports.gi.GLib;
const ExtensionUtils = imports.misc.extensionUtils;

const ME = ExtensionUtils.getCurrentExtension();
const _  = imports.gettext.domain('timepp').gettext;

class Settings {
    constructor () {
        {
            let GioSSS = Gio.SettingsSchemaSource;
            let schema = GioSSS.new_from_directory(
                ME.dir.get_path() + '/data/schemas', GioSSS.get_default(), false);
            schema = schema.lookup('org.gnome.shell.extensions.timepp', false);

            this.settings = new Gio.Settings({ settings_schema: schema });
        }

        this.builder = new Gtk.Builder();
        this.builder.set_translation_domain('timepp');
        this.builder.add_from_file(ME.path + '/data/prefs.ui');

        this.widget = this.builder.get_object('settings_widget');
        this.switcher = new Gtk.StackSwitcher({ visible: true, stack: this.builder.get_object('settings_stack'), halign: Gtk.Align.CENTER, });

        this._bind_settings();
	this._set_headerbar();
    }

    // Bind the gtk window to the schema settings
    _bind_settings () {
        let widget;

        //
        // @@@ General
        //
        this.settings.bind(
            'unicon-mode',
            this.builder.get_object('unicon-mode-switch'),
            'active',
            Gio.SettingsBindFlags.DEFAULT);

        widget = this.builder.get_object('panel-item-position-combo');
        widget.set_active(this.settings.get_enum('panel-item-position'));
        widget.connect('changed', (widget) => {
            this.settings.set_enum('panel-item-position', widget.get_active());
        });

        widget = this.builder.get_object('timer-enable-switch');
        widget.set_active(this.settings.get_value('sections').deep_unpack()['Timer'].enabled);
        widget.connect('state-set', (_, s) => {
            let v = this.settings.get_value('sections').deep_unpack();
            v['Timer'].enabled = s;
            this.settings.set_value('sections', GLib.Variant.new('a{sa{sb}}', v));
        });

        widget = this.builder.get_object('stopwatch-enable-switch');
        widget.set_active(this.settings.get_value('sections').deep_unpack()['Stopwatch'].enabled);
        widget.connect('state-set', (_, s) => {
            let v = this.settings.get_value('sections').deep_unpack();
            v['Stopwatch'].enabled = s;
            this.settings.set_value('sections', GLib.Variant.new('a{sa{sb}}', v));
        });

        widget = this.builder.get_object('pomodoro-enable-switch');
        widget.set_active( this.settings.get_value('sections').deep_unpack()['Pomodoro'].enabled);
        widget.connect('state-set', (_, s) => {
            let v = this.settings.get_value('sections').deep_unpack();
            v['Pomodoro'].enabled = s;
            this.settings.set_value('sections', GLib.Variant.new('a{sa{sb}}', v));
        });

        widget = this.builder.get_object('alarms-enable-switch');
        widget.set_active( this.settings.get_value('sections').deep_unpack()['Alarms'].enabled);
        widget.connect('state-set', (_, s) => {
            let v = this.settings.get_value('sections').deep_unpack();
            v['Alarms'].enabled = s;
            this.settings.set_value('sections', GLib.Variant.new('a{sa{sb}}', v));
        });

        widget = this.builder.get_object('todo-enable-switch');
        widget.set_active(this.settings.get_value('sections').deep_unpack()['Todo'].enabled);
        widget.connect('state-set', (_, s) => {
            let v = this.settings.get_value('sections').deep_unpack();
            v['Todo'].enabled = s;
            this.settings.set_value('sections', GLib.Variant.new('a{sa{sb}}', v));
        });

        //
        // @@@ Timer
        //
        this.settings.bind(
            'timer-separate-menu',
            this.builder.get_object('timer-separate-menu-switch'),
            'active',
            Gio.SettingsBindFlags.DEFAULT);

        this.settings.bind(
            'timer-show-seconds',
            this.builder.get_object('timer-show-seconds-switch'),
            'active',
            Gio.SettingsBindFlags.DEFAULT);

        widget = this.builder.get_object('timer-panel-mode-combo');
        widget.set_active(this.settings.get_enum('timer-panel-mode'));
        widget.connect('changed', (widget) => {
            this.settings.set_enum('timer-panel-mode', widget.get_active());
        });

        if (! this.settings.get_string('timer-sound-file-path')) {
            this.settings.set_string('timer-sound-file-path', GLib.filename_to_uri(ME.dir.get_path() + '/data/sounds/beeps.ogg', null));
        }

        widget = this.builder.get_object('timer-sound-button');
        widget.connect('clicked', (widget) => this._open_file_chooser(widget, 'timer-sound-file-path'));


        widget = this.builder.get_object('timer-notif-style-combo');
        widget.set_active(this.settings.get_enum('timer-notif-style'));
        widget.connect('changed', (widget) => {
            this.settings.set_enum('timer-notif-style', widget.get_active());
        });

        this.settings.bind(
            'timer-play-sound',
            this.builder.get_object('timer-play-sound-switch'),
            'active',
            Gio.SettingsBindFlags.DEFAULT);

        widget = this.builder.get_object('timer-keybinding-open');
        widget.set_text(this.settings.get_strv('timer-keybinding-open')[0]);
        widget.connect('changed', (entry) => {
            let [ok, key, mods] = Gtk.accelerator_parse(entry.get_text());

            if (ok) {
                entry["secondary-icon-name"] = null;
                let shortcut = Gtk.accelerator_name(key, mods);
                this.settings.set_strv('timer-keybinding-open', [shortcut]);
            }
            else {
                if (entry.get_text() !== '')
                    entry["secondary-icon-name"] = "dialog-warning-symbolic";
                else
                    entry["secondary-icon-name"] = "";
                this.settings.set_strv('timer-keybinding-open', ['']);
            }
        });

        widget = this.builder.get_object('timer-keybinding-open-fullscreen');
        widget.set_text(this.settings.get_strv('timer-keybinding-open-fullscreen')[0]);
        widget.connect('changed', (entry) => {
            let [ok, key, mods] = Gtk.accelerator_parse(entry.get_text());

                if (ok) {
                    entry["secondary-icon-name"] = null;
                    let shortcut = Gtk.accelerator_name(key, mods);
                    this.settings.set_strv('timer-keybinding-open-fullscreen', [shortcut]);
                }
                else {
                    if (entry.get_text() !== '')
                        entry["secondary-icon-name"] = "dialog-warning-symbolic";
                    else
                        entry["secondary-icon-name"] = "";
                    this.settings.set_strv('timer-keybinding-open-fullscreen', ['']);
                }
            });

        widget = this.builder.get_object('timer-keybinding-open-to-search-presets');
        widget.set_text(this.settings.get_strv('timer-keybinding-open-to-search-presets')[0]);
        widget.connect('changed', (entry) => {
            let [ok, key, mods] = Gtk.accelerator_parse(entry.get_text());

            if (ok) {
                entry["secondary-icon-name"] = null;
                let shortcut = Gtk.accelerator_name(key, mods);
                this.settings.set_strv('timer-keybinding-open-to-search-presets', [shortcut]);
            }
            else {
                if (entry.get_text() !== '')
                    entry["secondary-icon-name"] = "dialog-warning-symbolic";
                else
                    entry["secondary-icon-name"] = "";
                this.settings.set_strv('timer-keybinding-open-to-search-presets', ['']);
            }
        });

        //
        // @@@ Stopwatch
        //
        this.settings.bind(
            'stopwatch-separate-menu',
            this.builder.get_object('stopwatch-separate-menu-switch'),
            'active',
            Gio.SettingsBindFlags.DEFAULT);

        widget = this.builder.get_object('stopwatch-clock-format-combo');
        widget.set_active(this.settings.get_enum('stopwatch-clock-format'));
        widget.connect('changed', (widget) => {
            this.settings.set_enum('stopwatch-clock-format', widget.get_active());
        });

        widget = this.builder.get_object('stopwatch-panel-mode-combo');
        widget.set_active(this.settings.get_enum('stopwatch-panel-mode'));
        widget.connect('changed', (widget) => {
            this.settings.set_enum('stopwatch-panel-mode', widget.get_active());
        });

        widget = this.builder.get_object('stopwatch-keybinding-open');
        widget.set_text(this.settings.get_strv('stopwatch-keybinding-open')[0]);
        widget.connect('changed', (entry) => {
            let [ok, key, mods] = Gtk.accelerator_parse(entry.get_text());

            if (ok) {
                entry["secondary-icon-name"] = null;
                let shortcut = Gtk.accelerator_name(key, mods);
                this.settings.set_strv('stopwatch-keybinding-open', [shortcut]);
            }
            else {
                if (entry.get_text() !== '')
                    entry["secondary-icon-name"] = "dialog-warning-symbolic";
                else
                    entry["secondary-icon-name"] = "";
                this.settings.set_strv('stopwatch-keybinding-open', ['']);
            }
        });

        widget = this.builder.get_object('stopwatch-keybinding-open-fullscreen');
        widget.set_text(this.settings.get_strv('stopwatch-keybinding-open-fullscreen')[0]);
        widget.connect('changed', (entry) => {
            let [ok, key, mods] = Gtk.accelerator_parse(entry.get_text());

            if (ok) {
                entry["secondary-icon-name"] = null;
                let shortcut = Gtk.accelerator_name(key, mods);
                this.settings.set_strv('stopwatch-keybinding-open-fullscreen', [shortcut]);
            }
            else {
                if (entry.get_text() !== '')
                    entry["secondary-icon-name"] = "dialog-warning-symbolic";
                else
                    entry["secondary-icon-name"] = "";
                this.settings.set_strv('stopwatch-keybinding-open-fullscreen', ['']);
            }
        });

        //
        // @@@ Pomodoro
        //
        this.settings.bind(
            'pomodoro-separate-menu',
            this.builder.get_object('pomodoro-separate-menu-switch'),
            'active',
            Gio.SettingsBindFlags.DEFAULT);

        this.settings.bind(
            'pomodoro-show-seconds',
            this.builder.get_object('pomodoro-show-seconds-switch'),
            'active',
            Gio.SettingsBindFlags.DEFAULT);

        widget = this.builder.get_object('pomodoro-panel-mode-combo');
        widget.set_active(this.settings.get_enum('pomodoro-panel-mode'));
        widget.connect('changed', (widget) => {
            this.settings.set_enum('pomodoro-panel-mode', widget.get_active());
        });

        widget = this.builder.get_object('pomodoro-notif-style-combo');
        widget.set_active(this.settings.get_enum('pomodoro-notif-style'));
        widget.connect('changed', (widget) => {
            this.settings.set_enum('pomodoro-notif-style', widget.get_active());
        });

        this.settings.bind(
            'pomodoro-do-repeat-notif-sound',
            this.builder.get_object('pomodoro-do-repeat-notif-sound-switch'),
            'active',
            Gio.SettingsBindFlags.DEFAULT);

        if (! this.settings.get_string('pomodoro-sound-file-path-pomo')) {
            this.settings.set_string('pomodoro-sound-file-path-pomo', GLib.filename_to_uri(ME.dir.get_path() + '/data/sounds/beeps.ogg', null));
        }

        if (! this.settings.get_string('pomodoro-sound-file-path-short-break')) {
            this.settings.set_string('pomodoro-sound-file-path-short-break', GLib.filename_to_uri(ME.dir.get_path() + '/data/sounds/beeps.ogg', null));
        }

        if (!  this.settings.get_string('pomodoro-sound-file-path-long-break')) {
            this.settings.set_string('pomodoro-sound-file-path-long-break', GLib.filename_to_uri(ME.dir.get_path() + '/data/sounds/beeps.ogg', null));
        }

        widget = this.builder.get_object('pomodoro-sound-button-pomo');
        widget.connect('clicked', (widget) => this._open_file_chooser(widget, 'pomodoro-sound-file-path-pomo'));

        widget = this.builder.get_object('pomodoro-sound-button-short-break');
        widget.connect('clicked', (widget) => this._open_file_chooser(widget, 'pomodoro-sound-file-path-short-break'));

        widget = this.builder.get_object('pomodoro-sound-button-long-break');
        widget.connect('clicked', (widget) => this._open_file_chooser(widget, 'pomodoro-sound-file-path-long-break'));

        this.settings.bind(
            'pomodoro-play-sound-pomo',
            this.builder.get_object('pomodoro-play-sound-switch-pomo'),
            'active',
            Gio.SettingsBindFlags.DEFAULT);

        this.settings.bind(
            'pomodoro-play-sound-short-break',
            this.builder.get_object('pomodoro-play-sound-switch-short-break'),
            'active',
            Gio.SettingsBindFlags.DEFAULT);

        this.settings.bind(
            'pomodoro-play-sound-long-break',
            this.builder.get_object('pomodoro-play-sound-switch-long-break'),
            'active',
            Gio.SettingsBindFlags.DEFAULT);

        widget = this.builder.get_object('pomodoro-keybinding-open');
        widget.set_text(this.settings.get_strv('pomodoro-keybinding-open')[0]);
        widget.connect('changed', (entry) => {
            let [ok, key, mods] = Gtk.accelerator_parse(entry.get_text());

                if (ok) {
                    entry["secondary-icon-name"] = null;
                    let shortcut = Gtk.accelerator_name(key, mods);
                    this.settings.set_strv('pomodoro-keybinding-open', [shortcut]);
                }
                else {
                    if (entry.get_text() !== '')
                        entry["secondary-icon-name"] = "dialog-warning-symbolic";
                    else
                        entry["secondary-icon-name"] = "";
                    this.settings.set_strv('pomodoro-keybinding-open', ['']);
                }
            });

        widget = this.builder.get_object('pomodoro-keybinding-open-fullscreen');
        widget.set_text(this.settings.get_strv('pomodoro-keybinding-open-fullscreen')[0]);
        widget.connect('changed', (entry) => {
            let [ok, key, mods] = Gtk.accelerator_parse(entry.get_text());

            if (ok) {
                entry["secondary-icon-name"] = null;
                let shortcut = Gtk.accelerator_name(key, mods);
                this.settings.set_strv('pomodoro-keybinding-open-fullscreen', [shortcut]);
            }
            else {
                if (entry.get_text() !== '')
                    entry["secondary-icon-name"] = "dialog-warning-symbolic";
                else
                    entry["secondary-icon-name"] = "";
                this.settings.set_strv('pomodoro-keybinding-open-fullscreen', ['']);
            }
        });

        //
        // @@@ Alarms
        //
        this.settings.bind(
            'alarms-separate-menu',
            this.builder.get_object('alarms-separate-menu-switch'),
            'active',
            Gio.SettingsBindFlags.DEFAULT);

        if (! this.settings.get_string('alarms-sound-file-path')) {
            this.settings.set_string('alarms-sound-file-path', GLib.filename_to_uri(ME.dir.get_path() + '/data/sounds/beeps.ogg', null));
        }

        widget = this.builder.get_object('alarms-sound-button');
        widget.connect('clicked', (widget) => this._open_file_chooser(widget, 'alarms-sound-file-path'));

        widget = this.builder.get_object('alarms-notif-style-combo');
        widget.set_active(this.settings.get_enum('alarms-notif-style'));
        widget.connect('changed', (widget) => {
            this.settings.set_enum('alarms-notif-style', widget.get_active());
        });

        this.settings.bind(
            'alarms-play-sound',
            this.builder.get_object('alarms-play-sound-switch'),
            'active',
            Gio.SettingsBindFlags.DEFAULT);

        widget = this.builder.get_object('alarms-keybinding-open');
        widget.set_text(this.settings.get_strv('alarms-keybinding-open')[0]);
        widget.connect('changed', (entry) => {
            let [ok, key, mods] = Gtk.accelerator_parse(entry.get_text());

            if (ok) {
                entry["secondary-icon-name"] = null;
                let shortcut = Gtk.accelerator_name(key, mods);
                this.settings.set_strv('alarms-keybinding-open', [shortcut]);
            }
            else {
                if (entry.get_text() !== '')
                    entry["secondary-icon-name"] = "dialog-warning-symbolic";
                else
                    entry["secondary-icon-name"] = "";
                this.settings.set_strv('alarms-keybinding-open', ['']);
            }
        });

        //
        // @@@ Todo
        //
        this.settings.bind(
            'todo-separate-menu',
            this.builder.get_object('todo-separate-menu-switch'),
            'active',
            Gio.SettingsBindFlags.DEFAULT);

        widget = this.builder.get_object('todo-panel-mode-combo');
        widget.set_active(this.settings.get_enum('todo-panel-mode'));
        widget.connect('changed', (widget) => {
            this.settings.set_enum('todo-panel-mode', widget.get_active());
        });

        this.settings.bind(
            'todo-task-width',
            this.builder.get_object('todo-task-width-spin'),
            'value',
            Gio.SettingsBindFlags.DEFAULT);

        this.settings.bind(
            'todo-resume-tracking',
            this.builder.get_object('todo-resume-tracking-switch'),
            'active',
            Gio.SettingsBindFlags.DEFAULT);

        widget = this.builder.get_object('todo-keybinding-open');
        widget.set_text(this.settings.get_strv('todo-keybinding-open')[0]);
        widget.connect('changed', (entry) => {
            let [ok, key, mods] = Gtk.accelerator_parse(entry.get_text());

            if (ok) {
                entry["secondary-icon-name"] = null;
                let shortcut = Gtk.accelerator_name(key, mods);
                this.settings.set_strv('todo-keybinding-open', [shortcut]);
            }
            else {
                if (entry.get_text() !== '')
                    entry["secondary-icon-name"] = "dialog-warning-symbolic";
                else
                    entry["secondary-icon-name"] = "";
                this.settings.set_strv('todo-keybinding-open', ['']);
            }
        });

        widget = this.builder.get_object('todo-keybinding-open-to-add');
        widget.set_text(this.settings.get_strv('todo-keybinding-open-to-add')[0]);
        widget.connect('changed', (entry) => {
            let [ok, key, mods] = Gtk.accelerator_parse(entry.get_text());

            if (ok) {
                entry["secondary-icon-name"] = null;
                let shortcut = Gtk.accelerator_name(key, mods);
                this.settings.set_strv('todo-keybinding-open-to-add', [shortcut]);
            }
            else {
                if (entry.get_text() !== '')
                    entry["secondary-icon-name"] = "dialog-warning-symbolic";
                else
                    entry["secondary-icon-name"] = "";
                this.settings.set_strv('todo-keybinding-open-to-add', ['']);
            }
        });

        widget = this.builder.get_object('todo-keybinding-open-to-search');
        widget.set_text(this.settings.get_strv('todo-keybinding-open-to-search')[0]);
        widget.connect('changed', (entry) => {
            let [ok, key, mods] = Gtk.accelerator_parse(entry.get_text());

            if (ok) {
                entry["secondary-icon-name"] = null;
                let shortcut = Gtk.accelerator_name(key, mods);
                this.settings.set_strv('todo-keybinding-open-to-search', [shortcut]);
            }
            else {
                if (entry.get_text() !== '')
                    entry["secondary-icon-name"] = "dialog-warning-symbolic";
                else
                    entry["secondary-icon-name"] = "";
                this.settings.set_strv('todo-keybinding-open-to-search', ['']);
            }
        });

        widget = this.builder.get_object('todo-keybinding-open-to-stats');
        widget.set_text(this.settings.get_strv('todo-keybinding-open-to-stats')[0]);
        widget.connect('changed', (entry) => {
            let [ok, key, mods] = Gtk.accelerator_parse(entry.get_text());

            if (ok) {
                entry["secondary-icon-name"] = null;
                let shortcut = Gtk.accelerator_name(key, mods);
                this.settings.set_strv('todo-keybinding-open-to-stats', [shortcut]);
            }
            else {
                if (entry.get_text() !== '')
                    entry["secondary-icon-name"] = "dialog-warning-symbolic";
                else
                    entry["secondary-icon-name"] = "";
                this.settings.set_strv('todo-keybinding-open-to-stats', ['']);
            }
        });

        widget = this.builder.get_object('todo-keybinding-open-to-switch-files');
        widget.set_text(this.settings.get_strv('todo-keybinding-open-to-switch-files')[0]);
        widget.connect('changed', (entry) => {
            let [ok, key, mods] = Gtk.accelerator_parse(entry.get_text());

            if (ok) {
                entry["secondary-icon-name"] = null;
                let shortcut = Gtk.accelerator_name(key, mods);
                this.settings.set_strv('todo-keybinding-open-to-switch-files', [shortcut]);
            }
            else {
                if (entry.get_text() !== '')
                    entry["secondary-icon-name"] = "dialog-warning-symbolic";
                else
                    entry["secondary-icon-name"] = "";
                this.settings.set_strv('todo-keybinding-open-to-switch-files', ['']);
            }
        });

        widget = this.builder.get_object('todo-keybinding-open-todotxt-file');
        widget.set_text(this.settings.get_strv('todo-keybinding-open-todotxt-file')[0]);
        widget.connect('changed', (entry) => {
            let [ok, key, mods] = Gtk.accelerator_parse(entry.get_text());

            if (ok) {
                entry["secondary-icon-name"] = null;
                let shortcut = Gtk.accelerator_name(key, mods);
                this.settings.set_strv('todo-keybinding-open-todotxt-file', [shortcut]);
            }
            else {
                if (entry.get_text() !== '')
                    entry["secondary-icon-name"] = "dialog-warning-symbolic";
                else
                    entry["secondary-icon-name"] = "";
                this.settings.set_strv('todo-keybinding-open-todotxt-file', ['']);
            }
        });
    }

    _set_headerbar() {
        this.widget.connect('realize', () => {
        let window = this.widget.get_root();
	let headerBar = this.builder.get_object('header_bar');
	headerBar.set_title_widget(this.switcher);
	headerBar.set_show_title_buttons(false);
	return false;
	});
    }

    _open_file_chooser(widget, settingsKey) {
        let parent = widget.get_root();
        let file_chooser = new Gtk.FileChooserNative({
            title: "Choose file",
            action: Gtk.FileChooserAction.OPEN
        });

        file_chooser.set_transient_for(parent);
        file_chooser.set_select_multiple(false);
        file_chooser.set_modal(true);
        file_chooser.set_file(Gio.File.new_for_uri(this.settings.get_string(settingsKey)));
        file_chooser.connect('response', (widget, response) => {
            if (response !== Gtk.ResponseType.ACCEPT) {
                return;
            }
            this.settings.set_string(settingsKey, widget.get_file().get_uri());
        });
        file_chooser.show();
    }
}

function buildPrefsWidget () {
    let settings = new Settings();
    return settings.widget;
}

function init () {
    ExtensionUtils.initTranslations('timepp');
}
