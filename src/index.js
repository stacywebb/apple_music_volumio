import React from "react";
import ReactDOM from "react-dom";
import { isMobile, isAndroid, isIOS } from "react-device-detect";
import { FocusStyleManager } from "@blueprintjs/core";

import "normalize.css/normalize.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/core/lib/css/blueprint.css";

import "./s/index.css";
import App from "./App";
import Preview from "./i/Preview.png";

const MusicKit = window.MusicKit;
const REACT_APP_DEV_TOKEN = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkIyODVEVFZUTlkifQ.eyJpYXQiOjE1OTI0NTAzNTIsImV4cCI6MTYwODAwMjM1MiwiaXNzIjoiNEZLQjVZSEIzTiJ9.sUynQ99Xpu0temcpAKSWsz0pwtC0ksj0oiWMhDFASBWh85sWwBfHHLA3_JxrjL8ah_QweIpZSyNEfTHeUVJpJg';


function main(rm) {
  FocusStyleManager.onlyShowFocusOnTabs();
  MusicKit.configure({
    developerToken: process.env.REACT_APP_DEV_TOKEN,
    app: {
      name: "ThinMusic",
      build: "0.1"
    }
  });
  ReactDOM.render(<App />, document.getElementById("root"));
  if (rm) {
    remove();
  }
}

function remove() {
  let el = document.getElementById("loader");
  el.parentElement.removeChild(el);
}

if (isMobile) {
  let badge = "";
  if (isAndroid) {
    badge = (
      <a href="https://play.google.com/store/apps/details?id=com.apple.android.music&hl=en_US&pcampaignid=MKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1">
        <img
          style={{ padding: "10px", height: "100px" }}
          alt="Get it on Google Play"
          src="https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png"
        />
      </a>
    );
  }
  if (isIOS) {
    badge = (
      <a href="https://itunes.apple.com/us/app/apple-music/id1108187390?mt=8">
        <img
          style={{ padding: "10px", height: "80px" }}
          alt="Download on the App Store"
          src="https://linkmaker.itunes.apple.com/en-us/badge-lrg.svg?releaseDate=2016-05-23&kind=iossoftware&bubble=ios_apps"
        />
      </a>
    );
  }
  ReactDOM.render(
    <div>
    </div>,
    document.getElementById("root")
  );
  remove();
} else {
  main(true);
}
