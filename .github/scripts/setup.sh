#!/bin/bash

set -e

script_failure() {
        echo "An error occurred while performing the task on line $1" >&2
        echo "Setup for PolyUI development failed" >&2
}

trap 'script_failure $LINENO' ERR

echo "Setting up your system for PolyUI development!"

if ! which cargo &> /dev/null; then
        echo "Rust was not detected on your system. Ensure the 'rustc' and 'cargo' binaries are in your \$PATH."
        exit 1
fi

if [ "${POLYUI_SKIP_PNPM_CHECK:-}" != "true" ]; then
        
        if ! which pnpm &> /dev/null; then
                echo "PNPM was not detected on your system. Ensure the 'pnpm' command is in your \$PATH. You are not able to use Yarn or NPM."
                exit 1
        fi
else
        echo "Skipped PNPM check!"
fi

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if which apt-get &> /dev/null; then
                echo "Detected 'apt' based distro!"
                
                DEBIAN_TAURI_DEPS="libwebkit2gtk-4.0-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev" # Tauri dependencies
                DEBIAN_BINDGEN_DEPS="pkg-config clang"
                
                sudo apt-get -y update
                sudo apt-get -y install ${POLYUI_CUSTOM_APT_FLAGS:-} $DEBIAN_TAURI_DEPS $DEBIAN_BINDGEN_DEPS
        elif which pacman &> /dev/null; then
                echo "Detected 'pacman' based distro!"
                ARCH_TAURI_DEPS="webkit2gtk base-devel curl wget openssl appmenu-gtk-module gtk3 libappindicator-gtk3 librsvg libvips" # Tauri deps https://tauri.studio/guides/getting-started/setup/linux#1-system-dependencies
                ARCH_BINDGEN_DEPS="clang"

                sudo pacman -Syu
                sudo pacman -S --needed $ARCH_TAURI_DEPS $ARCH_BINDGEN_DEPS
        elif which dnf &> /dev/null; then
                echo "Detected 'dnf' based distro!"
                FEDORA_TAURI_DEPS="webkit2gtk3-devel.x86_64 openssl-devel curl wget libappindicator-gtk3 librsvg2-devel" # Tauri dependencies
                FEDORA_BINDGEN_DEPS="clang"

                sudo dnf check-update
                sudo dnf install $FEDORA_TAURI_DEPS $FEDORA_BINDGEN_DEPS
                sudo dnf group install "C Development Tools and Libraries"
        else
                echo "Your Linux distro '$(lsb_release -s -d)' is not supported by this script. We would welcome a PR or some help adding your OS to this script. https://github.com/spacedriveapp/spacedrive/issues"
                exit 1
        fi

        echo "Your machine has been setup for PolyUI development!"
elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Finished setting up."
else
        echo "Your OS '$OSTYPE' is not supported by this script. We would welcome a PR or some help adding your OS to this script. https://github.com/spacedriveapp/spacedrive/issues"
        exit 1
fi