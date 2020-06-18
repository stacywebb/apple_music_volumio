import React, { Component } from "react";
import {
  ButtonGroup,
  Button,
  Card,
  Colors,
  Icon,
  Elevation,
  Slider,
  Spinner,
  Toaster
} from "@blueprintjs/core";

import "./s/Player.css";
import Utils from "./Utils";
import Track from "./Track";
import Logo from "./Logo";

// none:      0
// loading:   1
// playing:   2
// paused:    3
// stopped:   4
// ended:     5
// seeking:   6
// waiting:   8
// stalled:   9
// completed: 10
const PS = window.MusicKit.PlaybackStates;

// none: 0
// one: 1
// all: 2
const RM = [Colors.GRAY1, Colors.BLUE1, Colors.RED1];
const RM_TITLES = ["Repeat: None", "Repeat: One", "Repeat: All"];

class Player extends Component {
  constructor(props) {
    super(props);
    this.interval = 0;
    this.state = {
      playbackState: null,
      sliderHover: false,
      visualize: false,
      volume: 1,
      disableControls: false,
      repeatMode: 0
    };
    this.slider = React.createRef();
  }

  componentDidMount = () => {
    this.props.music.addEventListener(
      "playbackStateDidChange",
      this.playbackChange
    );
  };

  componentWillUnmount = () => {
    if (this.interval !== 0) {
      clearInterval(this.interval);
    }
    this.props.music.removeEventListener(
      "playbackStateDidChange",
      this.playbackChange
    );
  };

  playbackChange = event => {
    let self = this;
    let defaultTitle = "ThinMusic: The Web Player for Apple Music";
    switch (event.state) {
      case PS.loading:
      case PS.stopped:
        window.document.title = defaultTitle;
        this.setState({
          playbackState: event.state,
          currentTime: null,
          totalTime: null
        });
        break;
      case PS.playing:
        self.setState({ playbackState: event.state });
        this.interval = setInterval(this.tick, 300);
        if (
          self.props.music.player.nowPlayingItem &&
          self.props.music.player.nowPlayingItem.attributes
        ) {
          let attrs = self.props.music.player.nowPlayingItem.attributes;
          let title = attrs.name ? attrs.name : "";
          title += " by ";
          title += attrs.artistName ? attrs.artistName : "";
          title += ", on ThinMusic";
          window.document.title = title;
        }
        break;
      default:
        window.document.title = defaultTitle;
        self.setState({ playbackState: event.state });
        if (this.interval !== 0) {
          clearInterval(this.interval);
          this.interval = 0;
        }
    }
  };

  tick = () => {
    if (this.state.playbackState !== PS.playing) return;
    this.setState({
      currentTime: this.props.music.player.currentPlaybackTime,
      totalTime: this.props.music.player.currentPlaybackDuration
    });
  };

  tickLabel = Utils.durationSeconds;

  hoverTime = event => {
    var rect = this.slider.current.getBoundingClientRect();
    return Math.floor(
      ((event.clientX - rect.left) / (rect.right - rect.left)) *
        this.props.music.player.currentPlaybackDuration
    );
  };

  sliderHoverEnter = event => {
    this.setState({
      sliderHover:
        this.state.playbackState === PS.playing ||
        this.state.playbackState === PS.paused
          ? true
          : false,
      hoverTime: this.hoverTime(event)
    });
  };

  sliderHoverMove = event => {
    this.setState({
      hoverTime: this.hoverTime(event)
    });
  };

  sliderHoverLeave = event => {
    this.setState({ sliderHover: false });
  };

  volumeChange = num => {
    this.props.audioElement.volume = num;
    this.setState({ volume: this.props.audioElement.volume });
  };

  volumeToggle = num => {
    if (this.props.audioElement.volume === 0) {
      Toaster.create().show({
        icon: "volume-up",
        intent: "primary",
        message: "Volume set to " + Math.round(this.state.volume * 100) + "%"
      });
      this.props.audioElement.volume = this.state.volume;
      this.setState({ volume: this.props.audioElement.volume });
    } else {
      Toaster.create().show({
        icon: "volume-off",
        intent: "primary",
        message: "Volume muted"
      });
      this.props.audioElement.volume = 0;
      this.setState({});
    }
  };

  repeatChange = () => {
    let target = (this.state.repeatMode + 1) % 3;
    this.props.music.player.repeatMode = target;
    Toaster.create().show({
      icon: "repeat",
      intent: "primary",
      message: RM_TITLES[target]
    });
    this.setState({
      repeatMode: target
    });
  };

  sliderChange = num => {
    this.props.music.player.pause();
    this.setState({ currentTime: num, disableControls: true });
  };

  sliderRelease = num => {
    let self = this;
    this.props.music.player.seekToTime(num).then(() => {
      self.props.music.player.play();
      self.setState({ disableControls: false });
    });
  };

  toggle = () => {
    if (this.state.playbackState === PS.playing) {
      this.props.music.player.pause();
    } else {
      this.props.music.player.play();
    }
  };

  toggleViz = () => {
    this.setState({ visualize: !this.state.visualize });
  };

  beginning = () => {
    let self = this;
    this.props.music.player.seekToTime(0).then(() => {
      if (self.state.playbackState === PS.paused) {
        self.props.music.player.play();
      }
    });
  };

  backward = () => {
    let self = this;
    let next = () => {
      // Bug in MusicKit, at index 1, back doesn't work?
      if (self.props.music.player.nowPlayingItemIndex === 1) {
        self.props.music.player.changeToMediaAtIndex(0);
      } else {
        self.props.music.player.skipToPreviousItem();
      }
    };

    // Don't wait until promise for UI feedback (spinner).
    this.setState({ playbackState: PS.stopped });

    // Why do this? There's a state glitch we're trying to avoid which we
    // just eat if track happends to be paused.
    if (this.props.music.player.isPlaying) {
      this.props.music.player.stop().then(next);
    } else {
      next();
    }
  };

  forward = () => {
    let self = this;
    let next = () => {
      self.props.music.player.skipToNextItem();
    };

    // Don't wait until promise for UI feedback (spinner).
    this.setState({ playbackState: PS.stopped });

    if (this.props.music.player.isPlaying) {
      this.props.music.player.stop().then(next);
    } else {
      next();
    }
  };

  render() {
    let track = "";
    let volume = "";
    let button = "play";
    let currentState = this.state.playbackState;

    let logo = (
      <Logo thin={Colors.BLUE5} music={Colors.BLUE5} bar={Colors.BLUE1} />
    );
    if (this.props.music.player.nowPlayingItem) {
      track = (
        <Track
          item={this.props.music.player.nowPlayingItem}
          audioContext={this.props.audioContext}
          audioSource={this.props.audioSource}
          visualize={this.state.visualize}
          showCollection={this.props.showCollection}
          click={this.props.audioContext ? this.toggleViz.bind(this) : null}
        />
      );
      if (
        currentState === PS.loading ||
        currentState === PS.waiting ||
        currentState === PS.stalled // FIXME: How to deal with stalled?
      ) {
        logo = <Spinner />;
      }
    }

    if (currentState === PS.playing) {
      button = "pause";
    }

    let stime = this.tickLabel(this.state.currentTime);
    if (this.state.sliderHover) {
      stime = <b>{this.tickLabel(this.state.hoverTime)}</b>;
    }

    if (this.props.audioElement) {
      volume = (
        <div>
          <Icon
            size={10}
            color={Colors.GRAY1}
            className="contentVolumeIcon"
            onClick={this.volumeToggle}
            icon={
              this.props.audioElement.volume === 0
                ? "volume-off"
                : this.props.audioElement.volume >= 0.5
                ? "volume-up"
                : "volume-down"
            }
          />
          <Slider
            min={0}
            max={1}
            className="contentVolume"
            onChange={this.volumeChange}
            value={this.props.audioElement.volume}
            stepSize={0.05}
          />
          <Icon
            className="contentVolumeIconRight"
            size={10}
            icon="repeat"
            color={RM[this.state.repeatMode]}
            onClick={this.repeatChange}
          />
        </div>
      );
    }

    return (
      <Card className="player" elevation={Elevation.TWO}>
        <div className="duration">
          <span className="start">{stime}</span>
          <span className="end">{this.tickLabel(this.state.totalTime)}</span>
        </div>
        <div
          className="slider"
          ref={this.slider}
          onPointerEnter={this.sliderHoverEnter}
          onPointerLeave={this.sliderHoverLeave}
          onPointerMove={this.sliderHoverMove}
        >
          <Slider
            min={0}
            max={this.state.totalTime || 1}
            disabled={
              !(
                this.state.playbackState === PS.playing ||
                this.state.playbackState === PS.paused
              )
            }
            onChange={this.sliderChange}
            onRelease={this.sliderRelease}
            labelRenderer={() => ""}
            labelStepSize={this.state.totalTime || 1}
            value={this.state.currentTime || 0}
          />
        </div>
        <div className="content">
          <div className="contentControls">
            <ButtonGroup className="contentButtons" large={true}>
              <Button
                icon="fast-backward"
                title="Previous Track"
                disabled={
                  this.state.disableControls ||
                  this.props.music.player.nowPlayingItemIndex <= 0
                }
                onClick={this.backward}
              />
              <Button
                icon="step-backward"
                title="Seek to Beginning"
                disabled={
                  this.state.disableControls ||
                  (currentState !== PS.playing && currentState !== PS.paused)
                }
                onClick={this.beginning}
              />
              <Button
                icon={button}
                title={currentState === PS.playing ? "Pause" : "Play"}
                disabled={
                  this.state.disableControls ||
                  (currentState !== PS.playing && currentState !== PS.paused)
                }
                onClick={this.toggle}
              />
              <Button
                icon="fast-forward"
                title="Next Track"
                disabled={
                  this.state.disableControls ||
                  this.props.music.player.nowPlayingItemIndex ===
                    this.props.music.player.queue.length - 1
                }
                onClick={this.forward}
              />
            </ButtonGroup>
            {volume}
          </div>
          <div className="contentTrack">{track}</div>
          <div className="contentLogo">{logo}</div>
        </div>
      </Card>
    );
  }
}

export default Player;
