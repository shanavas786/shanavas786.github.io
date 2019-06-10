---
layout: post
title:  "Setting up development environment -- Part 1"
date:   2019-06-03
description: "Setting up development environment"
categories: dev
excerpt:
  Documenting my desktop and editor setup

tags:
  - ide
  - dev
---

The process of setting up a good development environment takes time. You often
switch between tools until it feel comfortable. I have been going through the
same process and I feel I am almost in a stable state. Here is my current setup
so that I don't have to undergo the evolution again.

### [](#os) Os - Debian
I have been using [Debian GNU/Linux](https://debian.org) for a while and haven't
find a reason to switch. It keeps perfect balance between stability, security
and availability of latest version of softwares.

### [](#dm-wm) Display and Window Managers
I recently switched to [i3wm](https://i3wm.org), a [tiling window manager](https://en.wikipedia.org/wiki/Tiling_window_manager)
and [polybar](https://github.com/polybar/polybar) a status bar. That made me
switch from gdm to `lightdm` as the former spawns a lot of unnecessary services.

{% include figure.html
    src="desktop.png"
    title="Desktop"
    caption="Desktop"
%}

#### [](#dm-wm-install) Installation
  - i3

  Debian provides a meta package `i3` that installs `i3wm` with necessary tools.

```
sudo apt-get install i3 \
  feh \ # utility to set wallpaper
  brightnessctl \
  pulseaudio-utils \ # volume control utility
```

  - polybar

  `Polybar` has not been packaged for Debian yet. Building from source is straight
  forward once dependencies are met.

```
sudo apt-get install libcairo2 libcairo2-dev \
  libxcb-composite0-dev \
  libxcb-ewmh-dev \
  libxcb-icccm4-dev \
  libxcb-image0-dev \
  libxcb-util0-dev \
  libxcb-xfixes0-dev \
  python-xcbgen \
  xcb-proto \
  libcurl4 \
  libcurl4-gnutls-dev \
  fonts-font-awesome \ # icon support
  fonts-noto-mono \
  fonts-noto-ui-core

# clone the repo
git clone --recursive --depth=1 https://github.com/polybar/polybar
cd polybar
git checkout 3.3.1 -b b3.3.1 # checkout version 3.3.1
./build.sh
```

i3 and `polybar` can be customized with configuration files.
Here are my [configs](https://github.com/shanavas786/dot-files/tree/master/.config)

  - lightdm

```
  sudo apt-get install lightdm
```
  After installation, Debian will prompt you to choose default display manager.

Logout and select `i3` from `lightdm` settings. Done!!

### [](#shell-term) Shell and Terminal
[Fish](http://fishshell.com/) + [tmux](https://github.com/tmux/tmux) is good duo
that you may want to try.

`fish` gives better predictions and auto-completion than bash. `tmux` lets you
control a number of terminals from a single window.

I use [alacritty](https://github.com/jwilm/alacritty) as my terminal. It is a fast,
gpu accelerated terminal written in Rust.

#### Installation
  - Alacrity

  Alacritty has to be built from source since Debian doesn't have it packaged yet.
  You need to have rust and cargo installed.

```
sudo apt-get install cmake pkg-config libfreetype6-dev libfontconfig1-dev libxcb-xfixes0-dev
cargo build --release
```

To create a desktop entry

```
sudo cp target/release/alacritty /usr/local/bin # or anywhere else in $PATH
sudo cp extra/logo/alacritty-term.svg /usr/share/pixmaps/Alacritty.svg
sudo desktop-file-install extra/linux/alacritty.desktop
sudo update-desktop-database
```

To make it default terminal app, run

```
sudo update-alternatives --config x-terminal-emulator
```

and select alacritty.

  - Fish and tmux

  Both fish and tmux are availabe in debian package repo.

```
sudo apt-get install fish tmux
chsh -s `which fish` # make fish default shell
```


### [](#editor) Editor - GNU Emacs

I use [GNU Emacs](https://www.gnu.org/software/emacs) a highly customizable text
editor with Henrik Lissner's [doom-emacs](https://github.com/hlissner/doom-emacs/)
configuration.

#### Installation

  - GNU Emacs

  GNU Emacs releases are available in Debian package repository. I use GNU Emacs
27 which is based on master branch. To build from source,

```
sudo apt-get build-dep emacs # install dependencies
git clone https://github.com/emacs-mirror/emacs.git
cd emacs
./autogen.sh
./configure
make
sudo make install
```

  - Doom Emacs

```
  # copy private configs to ~/.doom.d
  # clone
  git clone https://github.com/hlissner/doom-emacs/ ~/.emacs.d
  cd .emacs.d
  git checkout develop
  ./bin/doom refresh
```

  This will install all the required Elisp packages.

Doom Emacs depends on several tools for each module to function properly.
We will see configuring Doom Emacs modules in next part. Thank you!
