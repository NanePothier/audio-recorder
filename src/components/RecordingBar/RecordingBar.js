import React, { useState, useEffect, useRef } from 'react';
import classes from './RecordingBar.module.css';
import AudioRecorder from '../../utils/AudioRecorder/AudioRecorder';
import { ICON } from '../../utils/icons';
import { REC_STATE } from '../../utils/AudioRecorder/AudioRecorderConstants';

const BTN_STATE = {
  RECORD: 'record',
  STOP_RECORD: 'stopRecord',
  PLAY: 'play',
  STOP_PLAY: 'stopPlay',
};

const RecordingBar = (props) => {
  const audioRecorder = useRef(null);

  const [btnState, setBtnState] = useState(BTN_STATE.RECORD);
  const [btnIcon, setBtnIcon] = useState(ICON.MIC);
  const [isRecording, setIsRecording] = useState(false);
  const [isInPlayState, setIsInPlayState] = useState(false);

  useEffect(() => {
    if (!audioRecorder.current) {
      audioRecorder.current = new AudioRecorder(processState);
    }
  }, []);

  const processState = (recorderState) => {
    if (recorderState === REC_STATE.RECORDING) {
      setIsRecording(true);
    } else if (recorderState === REC_STATE.RECORDED) {
      setIsRecording(false);
    }

    if (
      recorderState === REC_STATE.RECORDED ||
      recorderState === REC_STATE.PLAYING
    ) {
      setIsInPlayState(true);
    } else {
      setIsInPlayState(false);
    }

    if (recorderState === REC_STATE.INACTIVE) {
      setBtnState(BTN_STATE.RECORD);
      setBtnIcon(ICON.MIC);
    }
  };

  const handleBtnClick = () => {
    if (btnState === BTN_STATE.RECORD) {
      audioRecorder.current.record();
      setBtnState(BTN_STATE.STOP_RECORD);
    } else if (btnState === BTN_STATE.STOP_RECORD) {
      audioRecorder.current.stopRecord();
      setBtnState(BTN_STATE.PLAY);
      setBtnIcon(ICON.PLAY);
    } else if (btnState === BTN_STATE.PLAY) {
      audioRecorder.current.play();
      setBtnState(BTN_STATE.STOP_PLAY);
      setBtnIcon(ICON.PAUSE);
    } else if (btnState === BTN_STATE.STOP_PLAY) {
      audioRecorder.current.stopPlay();
      setBtnState(BTN_STATE.RECORD);
      setBtnIcon(ICON.MIC);
    }
  };

  return (
    <div className={classes.container}>
      <button
        className={`${classes.recordBtn} material-symbols-outlined ${
          isRecording && classes.recording
        } ${isInPlayState && classes.play}`}
        onClick={handleBtnClick}
      >
        {btnIcon}
      </button>
    </div>
  );
};

export default RecordingBar;
