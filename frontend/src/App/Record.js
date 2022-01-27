import React, { Component } from "react";
import { ReactMic as Visualizer } from "react-mic";
import Recorder from "./components/Recorder";
import PhraseBox from "./components/PhraseBox";
import Metrics from "./components/Metrics";
import hark from "hark";
import Wave from "./components/Wave";

// import microphoneSVG from './assets/microphone.svg'
import spacebarSVG from "./assets/space.svg";
import PSVG from "./assets/P.svg";
import rightSVG from "./assets/right.svg";

import { postAudio, getPrompt, getUser, createUser, getAudioLen, getPreviousFile, getPreviousMeta, getCurrentId } from "./api";
import { getUUID, getName } from "./api/localstorage";
// import ReactPlayer from 'react-player/youtube'

class Record extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userCreated: false,
      shouldRecord: false,
      displayWav: false,
      playPre: false,
      lastId: 0,
      lastPrompt: '',
      reRender: true,
      blob: undefined,
      play: false,
      prompt: "*error loading prompt... is the backend running?*",
      language: "",
      promptNum: 0,
      totalTime: 0,
      totalCharLen: 0,
      audioLen: 0,
      showPopup: true,
      backFlag: false,
      forwardFlag: false
    };

    this.uuid = getUUID();
    this.name = getName();
    // this.lastId = getCurrentId()
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown, false);
    this.requestUserDetails(this.uuid);
    this.requestLastId();
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown, false);
  }

  render() {
    return (
      <div id="PageRecord">
        <h1>Mimic Recording Studio</h1>
        <TopContainer
          userName={this.name}
          route={this.props.history.push}
          show={this.state.showPopup}
          dismiss={this.dismissPopup}
        />
        <Metrics
          totalTime={this.state.totalTime}
          totalCharLen={this.state.totalCharLen}
          promptNum={this.state.promptNum}
          totalPrompt={this.state.totalPrompt}
        />
        <PhraseBox
          prompt={this.state.prompt}
          promptNum={this.state.promptNum}
          audioLen={this.state.audioLen}
          totalCharLen={this.state.totalCharLen}
          totalTime={this.state.totalTime}
        />
        <div className="wave-container" id="container">
          {this.state.displayWav ? this.renderWave() : this.renderVisualizer()}
          <Recorder
            command={this.state.shouldRecord ? "start" : "stop"}
            onStart={() => this.shoulddisplayWav(false)}
            onStop={this.processBlob}
            gotStream={this.silenceDetection}
            playPre={this.state.playPre}
          />
          {/* <button onClick={this.start}>Play</button> */}
        </div>
        <div className="indicator-container">
          {this.state.shouldRecord
            ? "Read Now [Esc] to cancel"
            : "[Spacebar] to Start Recording [R] to review [->] for next"}
        </div>
        <div id="controls">
          <a
            id="btn_Play"
            className={`btn btn-next ${
              this.state.shouldRecord
                ? "btn-disabled"
                // : this.state.blob === undefined
                // ? "btn-disabled"
                : this.state.play
                ? "btn-disabled"
                : this.state.promptNum !== 0
                ? ''
                : 'btn-disabled'

            } `}
            style={{marginRight: "20px"}}
            // onClick={this.state.shouldRecord ? () => null : this.playPre}
            onClick={this.state.promptNum !== 0 ? this.start : () => null}
          >
            <i className="fas fa-backward ibutton" />
            Back
          </a>

          <a
            id="btn_Play"
            className={`btn btn-play ${
              this.state.shouldRecord
                ? "btn-disabled"
                : this.state.blob === undefined
                ? "btn-disabled"
                : this.state.play
                ? "btn-disabled"
                : null
            } `}
            onClick={this.state.shouldRecord ? () => null : this.state.play ? () => null : this.playWav}
            // onClick={this.start}
          >
            <i className="fas fa-play ibutton" />
            Review
          </a>
          <a
            id="btn-speak"
            className = " btn btn-speak"
            onClick={this.handleStartStop}
            // className = {`btn btn-speak ${
            //   this.state.backFlag
            //   ? "btn-disabled"
            //   : ""
            // }`}
            // onClick={this.state.backFlag ? () => null :this.handleStartStop}
          >
            <i
            className={`fas  ibutton ${
              !this.state.shouldRecord
                ? "fa-play"
                : "fa-pause"
            } `}
            />
            { !this.state.shouldRecord
                ? "Speak"
                : "Stop"}

          </a>
          <a
            id="btn_Next"
            className={`btn-next ${
              this.state.shouldRecord
                ? "btn-disabled"
                : this.state.blob === undefined
                ? "btn-disabled"
                : this.state.play
                ? "btn-disabled"
                : null
            }`}
            onClick={this.state.shouldRecord ? () => null : this.state.play ? () => null : this.onNext}
          >
            <i className="fas fa-forward ibutton-next" />
            Next
          </a>
          <a
            id="btn_Listen"
            className={`btn-next`} 
            onClick={this.listenAudio}
          >
            <i className="fas fa-volume-up ibutton-next" />
            Listen
          </a>
        </div>
      </div>
    );
  }

  dismissPopup = () => {
    this.setState({
      showPopup: false
    });
  };

  start = () => {
    // this.setState({
    //   lastId: this.state.lastId - 1,
    //   promptNum: this.state.promptNum - 1
    // });
    console.log("data: ",this.state.lastId)
    getPreviousMeta(this.uuid, this.state.lastId)
    .then(response => response.json())
    .then(res => {
      this.setState({
        prompt: res.prompt,
      })
      this.setState({
        backFlag: true
      })
      this.shoulddisplayWav(false);
      getPreviousFile(this.state.lastId, this.uuid, res.prompt)
      .then(function (response){
        return response.blob();
      })
      .then(res => {
        this.setState({
          blob: res,
          lastId: this.state.lastId - 1,
          promptNum: this.state.promptNum - 1,
          reRender: !this.state.reRender
        });
        console.log("data: ",this.state.lastId, this.state.promptNum)
        this.shoulddisplayWav(true);
      })
      .catch((error) => {
        console.log("error: ",error)
      })
    })
  }

  requestPrompts = uuid => {
    getPrompt(uuid)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          console.log(res)
          this.setState({
            prompt: res.data.prompt,
            totalPrompt: res.data.total_prompt
          });
        }
      });
  };

  requestLastId = () => {
    getCurrentId().then(response => {
      return response.json()
    })
    .then(response => {
      this.setState({
        lastId: response.id,
        lastPrompt: response.prompt
      })
      console.log("this.lastId: ", this.state.lastId);
      return response.id
    })
    .catch(error => {
        console.log('Model empty')
    })
  }

  requestNextId = () => {
    getCurrentId().then(response => {
      return response.json()
    })
    .then(response => {
      this.setState({
        lastId: response.id,
        lastPrompt: response.prompt
      })
      console.log("this.lastId: ", this.state.lastId);
      return response.id
    })
    .catch(error => {
        console.log('Model empty')
    })
  }

  requestUserDetails = uuid => {
    getUser(uuid)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          this.setState({
            userName: res.data.user_name,
            language: res.data.language,
            promptNum: res.data.prompt_num,
            totalTime: res.data.total_time_spoken,
            totalCharLen: res.data.len_char_spoken
          });
          this.requestPrompts(this.uuid);
        } else {
          if (this.uuid) {
            createUser(this.uuid, this.name)
              .then(res => res.json())
              .then(res => {
                if (res.success) {
                  this.setState({ userCreated: true });
                  this.requestPrompts(this.uuid);
                } else {
                  alert("sorry there is in error creating user");
                }
              });
          } else {
            alert("sorry there is in error creating user");
          }
        }
      });
  };

  renderWave = () => (
    <Wave
      className="wavedisplay"
      waveColor="#FD9E66"
      blob={this.state.blob}
      play={this.state.play}
      onFinish={this.stopWav}
      reRender={this.state.reRender}
    />
  );

  renderVisualizer = () => (
    // <h1>Abc</h1>
    <Visualizer
      className="wavedisplay"
      record={this.state.shouldRecord}
      backgroundColor={"#222222"}
      strokeColor={"#FD9E66"}
    />
  );

  processBlob = blob => {
    console.log("bobbb: ", blob)
    getAudioLen(this.uuid, blob)
      .then(res => res.json())
      .then(res =>{
        console.log(res.data.audio_len)
          this.setState({
            audioLen: res.data.audio_len
          })
        }
      );
    this.setState({
      blob: blob
    });
    this.shoulddisplayWav(true);
  };

  shoulddisplayWav = bool => this.setState({ displayWav: bool });

  playWav = () => this.setState({ play: true });

  recordWav = () => this.setState({ speak: true });

  stopWav = () => this.setState({ play: false });

  playPre = () => {
    getPreviousFile(this.uuid, this.state.blob)
    .then(function (response){
      return response.blob();
    })
    .then((res)=>{
      this.setState({
        blob: res
      })
      return res;
    })
    .catch((error) => {
      console.log("error")
    })
  }

  handleStartStop = event => {
    if (!this.state.shouldRecord) {
      event.preventDefault();
      this.recordHandler();
    }
    this.setState({
      shouldRecord: false,
      displayWav: false,
      blob: undefined,
      // promptNum: 0,
      totalTime: 0,
      totalCharLen: 0,
      audioLen: 0,
      play: false
    });

  }
  handleKeyDown = event => {
    // space bar code
    // if (event.keyCode === 32) {
    // // if (this.speak === true) {
    //   if (!this.state.shouldRecord) {
    //     event.preventDefault();
    //     this.recordHandler();
    //   }
    // }

    // esc key code
    if (event.keyCode === 27) {
      event.preventDefault();

      // resets all states
      this.setState({
        shouldRecord: false,
        displayWav: false,
        blob: undefined,
        // promptNum: 0,
        totalTime: 0,
        totalCharLen: 0,
        audioLen: 0,
        play: false
      });
    }
    // play wav
    if (event.keyCode === 82) {
      this.playWav();
    }

    // next prompt
    if (event.keyCode === 39) {
        //if (!this.state.play) {
          this.onNext();
       // }
     }
  };

  recordHandler = () => {
    setTimeout(() => {
      this.setState((state, props) => {
        return {
          shouldRecord: true,
          play: false
        };
      });
    }, 500);
  };

  listenAudio = () => {
    // alert("Hello world");
     let utterance = new SpeechSynthesisUtterance(this.state.prompt);
     speechSynthesis.speak(utterance);
  }
  onNext = () => {
    let currentId = this.state.lastId;
    this.requestLastId();
    console.log("last Id: ===", currentId, this.state.lastId);
    if (this.state.blob !== undefined) {
      postAudio(this.state.blob, this.state.prompt, this.uuid, this.state.lastId)
        .then(res => res.json())
        .then(res => {
          if (res.success) {
            if(currentId === this.state.lastId - 1 || currentId > this.state.lastId - 1 ){
              this.requestLastId();
              this.setState({ displayWav: false });
              this.requestPrompts(this.uuid);
              this.requestUserDetails(this.uuid);
              this.setState({
                blob: undefined,
                audioLen: 0
              });
              if(this.state.backFlag !== true){
                this.setState({
                  lastId: this.state.lastId + 1
                })
              }
            } else{
              if (this.state.backFlag === true){
                currentId = currentId + 1;
              }
              getPreviousMeta(this.uuid, currentId + 1)
              .then(response => response.json())
              .then(res => {
                this.setState({
                  prompt: res.prompt,
                })
                this.setState({
                  backFlag: false
                })
                this.shoulddisplayWav(false);
                getPreviousFile(this.state.lastId, this.uuid, res.prompt)
                .then(function (response){
                  return response.blob();
                })
                .then(res => {
                  this.setState({
                    blob: res,
                    lastId: currentId + 1,
                    // lastId: this.state.lastId + 1,
                    promptNum: this.state.promptNum + 1,
                    reRender: !this.state.reRender
                  });
                  console.log("data: ",this.state.lastId, this.state.promptNum)
                  this.shoulddisplayWav(true);
                })
                .catch((error) => {
                  console.log("error: ",error)
                })
              })
            }
          } else {
            console.log("Write new audio file");
          }
        })
        .catch(err => console.log(err));
    } else if(this.state.backFlag === true){
      this.setState({ displayWav: false });
      // this.setState({shouldRecord:true})
      this.setState({backFlag: false});
      this.requestPrompts(this.uuid);
      this.requestUserDetails(this.uuid);
      this.setState({
        blob: undefined,
        audioLen: 0
      });
    }
    else{
      this.setState({ displayWav: false });
            this.requestPrompts(this.uuid);
            this.requestUserDetails(this.uuid);
            this.setState({
              blob: undefined,
              audioLen: 0
      });
    }
  };

  silenceDetection = stream => {
    const options = {
      interval: "150",
      threshold: -80
    };
    const speechEvents = hark(stream, options);

    speechEvents.on("stopped_speaking", () => {
      this.setState({
        shouldRecord: false
      });
    });
  };
}

class TopContainer extends Component {
  render() {
    return this.props.show ? this.renderContainer() : null;
  }

  renderContainer = () => {
    return (
      <div className="top-container">
        <div className="top-container-info">
          <div className="instructions2">
            <i className="fas fa-info-circle" />
            <h2>HINTS</h2>
            <ul className="hints">
              <li>
                <img src={spacebarSVG} className="key-icon" alt="space" /> will
                start recording
              </li>
              <li>Recording will auto-stop after you speak</li>
              <li>
                <img src={PSVG} className="key-icon" alt="p" /> will play
                recorded audio
              </li>
              <li>
                <img src={rightSVG} className="key-icon" alt="->" /> will go to
                next prompt
              </li>
            </ul>
          </div>
          <div className="session-info">
            <div className="top-info">
              <div>
                <h2>RECORDER</h2>
                &nbsp;
                <span id="sessionName">{this.props.userName}</span>
              </div>
              <div className="btn-restart" />
            </div>
            <hr />
            <p>
              It is very important that the recorded words{" "}
              <span className="highlight">
                match the text in the script exactly
              </span>
              . If you accidentally deviate from the script or are unsure,
              please record the prompt again.
            </p>
          </div>
        </div>
        <button className="btn info-btn" onClick={this.handleClick}>
          Tutorial
        </button>
        <button className="btn info-btn" onClick={this.props.dismiss}>
          Continue
        </button>
      </div>
    );
  };

  handleClick = () => {
    this.props.route("/tutorial");
  };
}

export default Record;