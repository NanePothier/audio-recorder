import React, { useState, useEffect, useRef } from 'react';
import classes from './RecordingBox.module.css';
import AudioRecorder from '../../utils/AudioRecorder/AudioRecorder';
import { ICON } from '../../utils/icons';
import { REC_STATE } from '../../utils/AudioRecorder/AudioRecorderConstants';

const BTN_STATE = {
  RECORD: 'record',
  STOP_RECORD: 'stopRecord',
  PLAY: 'play',
  STOP_PLAY: 'stopPlay',
};

const RecordingBox = (props) => {
  const audioRecorder = useRef(null);

  const [btnState, setBtnState] = useState(BTN_STATE.RECORD);
  const [btnIcon, setBtnIcon] = useState(ICON.MIC);
  const [isRecording, setIsRecording] = useState(false);
  const [isInPlayState, setIsInPlayState] = useState(false);
  const [retryIsDisabled, setRetryIsDisabled] = useState(true);

  useEffect(() => {
    if (!audioRecorder.current) {
      audioRecorder.current = new AudioRecorder(processState);
      audioRecorder.current.sendVolumeLevel = processVolumeLevel;
      audioRecorder.current.onPlaybackEnded = processPlaybackEnded;
    }
  }, []);

  const processState = (recorderState) => {
    if (recorderState === REC_STATE.RECORDING) {
      setIsRecording(true);
    } else if (recorderState === REC_STATE.RECORDED) {
      setIsRecording(false);
    }

    if (recorderState === REC_STATE.RECORDED) {
      setIsInPlayState(true);
    }
  };

  const processVolumeLevel = (volLevel) => {
    // do something with the volume level
  };

  const processPlaybackEnded = () => {
    setBtnState(BTN_STATE.PLAY);
    setBtnIcon(ICON.PLAY);
    setRetryIsDisabled(false);
  };

  const handleRecordBtnClick = () => {
    if (btnState === BTN_STATE.RECORD) {
      audioRecorder.current.record();
      setBtnState(BTN_STATE.STOP_RECORD);
    } else if (btnState === BTN_STATE.STOP_RECORD) {
      audioRecorder.current.stopRecord();
      updateRecordBtn(BTN_STATE.PLAY, ICON.PLAY, false);
    } else if (btnState === BTN_STATE.PLAY) {
      audioRecorder.current.play();
      updateRecordBtn(BTN_STATE.STOP_PLAY, ICON.PAUSE, true);
    } else if (btnState === BTN_STATE.STOP_PLAY) {
      audioRecorder.current.stopPlay();
      updateRecordBtn(BTN_STATE.PLAY, ICON.PLAY, false);
    }
  };

  const updateRecordBtn = (state, icon, retryDisabled) => {
    setBtnState(state);
    setBtnIcon(icon);
    setRetryIsDisabled(retryDisabled);
  };

  const handleTryAgain = () => {
    audioRecorder.current.reset();
    setBtnState(BTN_STATE.RECORD);
    setBtnIcon(ICON.MIC);
    setRetryIsDisabled(true);
    setIsInPlayState(false);
  };

  return (
    <div className={classes.container}>
      <button
        className={`${classes.recordBtn} material-symbols-outlined ${
          isRecording && classes.recording
        } ${isInPlayState && classes.play}`}
        onClick={handleRecordBtnClick}
      >
        {btnIcon}
      </button>
      <div className={classes.tryAgainBox}>
        <div className={classes.tryAgainTxt}>Try Again</div>
        <button
          className={`${classes.tryAgainIcon} ${
            retryIsDisabled && classes.retryDisabled
          } material-symbols-outlined`}
          onClick={handleTryAgain}
          disabled={retryIsDisabled}
        >
          {ICON.REPLAY}
        </button>
      </div>
    </div>
  );
};

export default RecordingBox;
