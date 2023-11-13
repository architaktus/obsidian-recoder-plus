It's still an early Version

## Obsidian Recorder Plus
This plugin provide a better recorder in Obsidian
- just record, you could pause and stop
- more than record, with configs and more

## Features
- from native WebAPI feature, clean and save:
    - ~~use audioContext as Method, **NO MORE BitRate limit**!~~ (s.Issue #1, still debugging...)
    - adopt newest WebCodecs as encoder, your Recording has correct and accurate duration info now (which means **SEEKABLE**)!
- open in Obsidian's sidebar with more control options (PC: with hover editor you could also hover it.)
- more than native recorder, you could configure the quality, could **CONTROL** the recording (e.g. pause, resume, set timeout..)
- rename and save to other places as wish
- encode type & file type as wish
- (upcoming) multi-platform
- (upcoming) pin timestamps while recording

## Supported Codecs/File Formats:
- aac/m4a
- opus&vorbis/webM
- ~~pcm/wav (working on it...)~~
- flac/flac (upcoming)

## Demo
TODO

## TODO
* [ ] mobile version & different platforms
    * [x] Windows
    * [x] macOS
    * [ ] iOS
    * [ ] ipadOS
    * [ ] android
* [ ] more config options, more supported file formats
* [ ] better UI
    * [ ] ribbon icon
    * [ ] better config for mobile
    * [ ] Recorder UI visualization
* [ ] readme & demo
* [ ] i18n


## Reference & Note
- Recorder:
    - common method: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
    - method adopted here: 
        - WebCodecs
        - AudioContext: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
- webM, which is a strict mode of matroska:
    - codec: https://www.matroska.org/technical/codec_specs.html
- packaging: https://github.com/davedoesdev/webm-muxer.js, https://github.com/Vanilagy/webm-muxer
- I am not sure if it is the limit of Electron. bitRate is max. 300Kb/s when using inner Encoder of any kind. I am trying hard to figure it out. For now, the only way to break this limit is directly reach AudioContext and get the stream either from audioWorklet or create a MediaStreamTrackProcessor, which I am still working on.