import { REC_STATE } from './AudioRecorderConstants';

class AudioRecorder {
  bufferSourceNode;
  audioDuration;
  analyserInterval;
  bufferSourceNodeUsed = false;

  constructor(
    sendStatus = () => {},
    sendVolumeLevel = () => {},
    onPlaybackEnded = () => {}
  ) {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then((mediaStream) => {
          this.mediaChunks = [];
          this.sendVolumeLevel = sendVolumeLevel;
          this.sendPlaybackEnded = onPlaybackEnded;
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
    try {
      if (
        this.mediaRecorder &&
        this.mediaRecorder.state !== REC_STATE.RECORDING
      ) {
        this.recorderState = REC_STATE.RECORDING;
        this.mediaRecorder.start();

        this.analyserInterval = setInterval(() => {
          const freqData = new Float32Array(this.analyserNode.fftSize);
          this.analyserNode.getFloatTimeDomainData(freqData);

          let total = 0;
          freqData.forEach((sample) => {
            total += Math.abs(sample);
          });
          const value = total / freqData.length;
          this.sendVolumeLevel(value);
        }, 50);
      }
    } catch (e) {
      console.log('Error trying to start recording: ' + e);
    }
  }

  stopRecord() {
    if (this.mediaRecorder && this.mediaRecorder.state !== REC_STATE.INACTIVE) {
      this.recorderState = REC_STATE.RECORDED;
      this.mediaRecorder.stop();

      if (this.analyserInterval) {
        clearInterval(this.analyserInterval);
        this.analyserInterval = null;
      }
    }
  }

  play() {
    try {
      if (this.bufferSourceNode && this.bufferSourceNode.buffer) {
        if (this.bufferSourceNodeUsed) {
          this.createBufferSourceNode(null, true);
          this.bufferSourceNodeUsed = false;
        }

        this.recorderState = REC_STATE.PLAYING;
        this.bufferSourceNode.start();
      }
    } catch (e) {
      console.log('Error trying to play recording: ' + e);
    }
  }

  stopPlay() {
    if (this.bufferSourceNode && this.bufferSourceNode.buffer) {
      this.recorderState = REC_STATE.STOPPED;
      this.bufferSourceNode.stop();
    }
  }

  // we can only call start() on the AudioBufferSourceNode once during its lifetime
  // so create new one for each playback
  createBufferSourceNode(audioBuffer, copyBuffer = false) {
    try {
      let tempBuffer;

      if (this.bufferSourceNode) {
        if (copyBuffer) {
          tempBuffer = this.bufferSourceNode.buffer;
        }
        this.bufferSourceNode.disconnect(this.audioCtx.destination);
      }

      this.bufferSourceNode = this.audioCtx.createBufferSource();
      this.bufferSourceNode.buffer = copyBuffer ? tempBuffer : audioBuffer;
      this.bufferSourceNode.onended = this.onPlaybackEnded.bind(this);
      this.bufferSourceNode.connect(this.audioCtx.destination); // connect to output
    } catch (e) {
      console.log('Error trying to create new bufferSourceNode: ' + e);
    }
  }

  reset() {
    this.audioDuration = null;
  }

  onDataAvailable(chunk) {
    this.mediaChunks.push(chunk.data);
  }

  onPlaybackEnded(e) {
    this.bufferSourceNodeUsed = true;
    this.recorderState = REC_STATE.INACTIVE;
    this.sendPlaybackEnded();
  }

  async onStop() {
    try {
      const blob = new Blob(this.mediaChunks, {
        type: 'audio/ogg; codecs=opus',
      });
      this.mediaChunks = [];

      const arrayBuffer = await blob.arrayBuffer();
      const decodedData = await this.audioCtx.decodeAudioData(arrayBuffer);

      this.createBufferSourceNode(decodedData, false);
      this.audioDuration = decodedData.duration;
    } catch (e) {
      console.log('Something went wrong trying to create audio.');
    }
  }

  onError(event) {
    console.log('Fatal error occurred, recording stopped: ' + event.error);
  }
}

export default AudioRecorder;
