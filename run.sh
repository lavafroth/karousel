#!/bin/bash

# source: https://unix.stackexchange.com/a/517690

set -e

bash_source_absolute="$(pwd)/${BASH_SOURCE[0]}"
karousel_dir="$(dirname "$bash_source_absolute")"
kwin_script_path="$karousel_dir/karousel/contents/code/main.qml"

num=$(dbus-send --print-reply --dest=org.kde.KWin \
    /Scripting org.kde.kwin.Scripting.loadDeclarativeScript \
    string:"$kwin_script_path" | awk 'END {print $2}' )

dbus-send --print-reply --dest=org.kde.KWin /$num \
    org.kde.kwin.Script.run

echo 'Press enter to stop the script'
read
dbus-send --print-reply --dest=org.kde.KWin /$num \
    org.kde.kwin.Script.stop

echo 'Press enter to kill KWin'
read
killall kwin_x11
