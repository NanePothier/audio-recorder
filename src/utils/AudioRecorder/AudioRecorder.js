const STATE = {
  INACTIVE: 'inactive',
  RECORDING: 'recording',
  PAUSED: 'paused',
};

class AudioRecorder {
  bufferSourceNode;

  constructor() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then((mediaStream) => {
          this.mediaChunks = [];
          this.audioStream = mediaStream;

          this.audioCtx = new AudioContext(); // audio-processing graph
          this.streamSourceNode =
            this.audioCtx.createMediaStreamSource(mediaStream);
          this.analyserNode = this.audioCtx.createAnalyser();
          this.streamSourceNode.connect(this.analyserNode);

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
      this.mediaRecorder.start();
    }
  }

  stopRecord() {
    if (this.mediaRecorder && this.mediaRecorder.state !== STATE.INACTIVE) {
      this.mediaRecorder.stop();
    }
  }

  play() {
    if (this.bufferSourceNode && this.bufferSourceNode.buffer) {
      this.bufferSourceNode.start();
    }
  }

  stopPlay() {
    if (this.bufferSourceNode && this.bufferSourceNode.buffer) {
      this.bufferSourceNode.stop();
    }
  }

  onDataAvailable(chunk) {
    this.mediaChunks.push(chunk.data);
  }

  async onStop() {
    try {
      const blob = new Blob(this.mediaChunks, {
        type: 'audio/ogg; codecs=opus',
      });
      this.mediaChunks = [];

      const arrayBuffer = await blob.arrayBuffer();
      const decodedData = await this.audioCtx.decodeAudioData(arrayBuffer);

      // we can only call start() on the AudioBufferSourceNode once during its lifetime
      // so create new one every time we stop recording
      this.bufferSourceNode = this.audioCtx.createBufferSource();
      this.bufferSourceNode.buffer = decodedData;
      this.bufferSourceNode.connect(this.audioCtx.destination); // connect to output
    } catch (e) {
      console.log('Something went wrong trying to create audio.');
    }
  }

  onError(event) {
    console.log('Fatal error occurred, recording stopped: ' + event.error);
  }
}

export default AudioRecorder;
