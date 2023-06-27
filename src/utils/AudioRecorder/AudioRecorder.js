import { REC_STATE } from './AudioRecorderConstants';

class AudioRecorder {
  bufferSourceNode;
  audioDuration;

  constructor(sendStatus = () => {}) {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then((mediaStream) => {
          this.mediaChunks = [];
          this.audioStream = mediaStream;
          this.recorderState = REC_STATE.INACTIVE;

          this.audioCtx = new AudioContext(); // audio-processing graph
          this.streamSourceNode =
            this.audioCtx.createMediaStreamSource(mediaStream);
          this.analyserNode = this.audioCtx.createAnalyser();
          this.streamSourceNode.connect(this.analyserNode);

          this.mediaRecorder = new MediaRecorder(mediaStream);
          this.mediaRecorder.ondataavailable = this.onDataAvailable.bind(this);
          this.mediaRecorder.onstop = this.onStop.bind(this);
          this.mediaRecorder.onerror = this.onError.bind(this);

          this.audioInterval = setInterval(() => {
            sendStatus(this.recorderState);
          }, 200);
        })
        .catch((error) => {
          console.log('The following getUserMedia error occurred: ' + error);
        });
    } else {
      console.log('Recording is not supported in your browser.');
    }
  }

  record() {
    if (
      this.mediaRecorder &&
      this.mediaRecorder.state !== REC_STATE.RECORDING
    ) {
      this.recorderState = REC_STATE.RECORDING;
      this.mediaRecorder.start();
    }
  }

  stopRecord() {
    if (this.mediaRecorder && this.mediaRecorder.state !== REC_STATE.INACTIVE) {
      this.recorderState = REC_STATE.RECORDED;
      this.mediaRecorder.stop();
    }
  }

  play() {
    if (this.bufferSourceNode && this.bufferSourceNode.buffer) {
      this.recorderState = REC_STATE.PLAYING;
      this.bufferSourceNode.start();
    }
  }

  stopPlay() {
    if (this.bufferSourceNode && this.bufferSourceNode.buffer) {
      this.recorderState = REC_STATE.STOPPED;
      this.bufferSourceNode.stop();
    }
  }

  onDataAvailable(chunk) {
    this.mediaChunks.push(chunk.data);
  }

  onPlaybackEnded(e) {
    this.recorderState = REC_STATE.INACTIVE;
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
      this.audioDuration = decodedData.duration;
      this.bufferSourceNode.onended = this.onPlaybackEnded.bind(this);
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
