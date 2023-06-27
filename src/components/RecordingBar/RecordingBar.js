import React, { useState, useEffect, useRef } from 'react';
import classes from './RecordingBar.module.css';
import AudioRecorder from '../../utils/AudioRecorder/AudioRecorder';
import { ICON } from '../../utils/icons';

const STATE = {
  RECORD: 'record',
  STOP_RECORD: 'stopRecord',
  PLAY: 'play',
  STOP_PLAY: 'stopPlay',
};

const RecordingBar = (props) => {
  const audioRecorder = useRef(null);

  const [btnState, setBtnState] = useState(STATE.RECORD);
  const [btnIcon, setBtnIcon] = useState(ICON.MIC);

  useEffect(() => {
    if (!audioRecorder.current) {
      audioRecorder.current = new AudioRecorder();
    }
  }, []);

  const handleBtnClick = () => {
    if (btnState === STATE.RECORD) {
      audioRecorder.current.record();
      setBtnState(STATE.STOP_RECORD);
    } else if (btnState === STATE.STOP_RECORD) {
      audioRecorder.current.stopRecord();
      setBtnState(STATE.PLAY);
      setBtnIcon(ICON.PLAY);
    } else if (btnState === STATE.PLAY) {
      audioRecorder.current.play();
      setBtnState(STATE.STOP_PLAY);
      setBtnIcon(ICON.PAUSE);
    } else if (btnState === STATE.STOP_PLAY) {
      audioRecorder.current.stopPlay();
      setBtnState(STATE.RECORD);
      setBtnIcon(ICON.MIC);
    }
  };

  return (
    <div className={classes.container}>
      <button
        className={`${classes.recordBtn} material-symbols-outlined`}
        onClick={handleBtnClick}
      >
        {btnIcon}
      </button>
    </div>
  );
};

export default RecordingBar;
