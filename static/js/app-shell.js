// app-shell.js -- start-up for the sidebar layout: a one-time switch to the side bar, then the layout classes for the tab you're on (tab-layout.js).

// One-time migration to the new navigation. Existing names, colours and hidden pages are preserved.
if (liveStore('appShellV1') !== '1') {
  liveStore('tabBarMode', 'side');
  liveStore('tabBarSide', 'left');
  liveStore('appShellV1', '1');
}
tabLayoutApply(liveStore('appTab') || 'home');
