const STATE = {
  INACTIVE: 'inactive',
  RECORDING: 'recording',
  PAUSED: 'paused',
};

class AudioRecorder {
  audio;

  constructor() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then((mediaStream) => {
          this.mediaChunks = [];
          this.audioStream = mediaStream;
          this.mediaRecorder = new MediaRecorder(mediaStream);
          this.mediaRecorder.ondataavailable = this.onDataAvailable.bind(this);
          this.mediaRecorder.onstop = this.onStop.bind(this);
          this.mediaRecorder.onerror = this.onError.bind(this);
        })
        .catch((error) => {
          console.log('The following getUserMedia error occurred: ' + error);
        });
    } else {
      console.log('Recording is not supported in your browser.');
    }
  }

  record() {
    if (this.mediaRecorder && this.mediaRecorder.state !== STATE.RECORDING) {
      this.audio = null;
      this.mediaRecorder.start();
    }
  }

  stopRecord() {
    if (this.mediaRecorder && this.mediaRecorder.state !== STATE.INACTIVE) {
      this.mediaRecorder.stop();
    }
  }

  play() {
    if (this.audio) {
      this.audio.play();
    }
  }

  stopPlay() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  onDataAvailable(chunk) {
    this.mediaChunks.push(chunk.data);
  }

  onStop() {
    try {
      const blob = new Blob(this.mediaChunks, {
        type: 'audio/ogg; codecs=opus',
      });
      this.mediaChunks = [];
      const audioUrl = window.URL.createObjectURL(blob);
      this.audio = new Audio(audioUrl);
    } catch (e) {
      console.log('Something went wrong trying to create audio.');
    }
  }

  onError(event) {
    console.log('Fatal error occurred, recording stopped: ' + event.error);
  }
}

export default AudioRecorder;
