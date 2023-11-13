## Obsidian Recorder Plus
This plugin provide a better recorder in Obsidian
- just record, you could pause and stop
- more than record, with configs and more

## Features
- from native WebAPI feature, clean and save:
    - use audioContext as Method, **NO MORE BitRate limit**!
    - adopt newest WebCodecs as encoder, your Recording has correct and accurate duration info now (which means **SEEKABLE**)!
- open in Obsidian's sidebar with more control options (PC: with hover editor you could also hover it.)
- more than native recorder, you could configure the quality, could **CONTROL** the recording (e.g. pause, resume, set timeout..)
- rename and save to other places as wish
- (upcoming) multi-platform
- (upcoming) encode type & file type as wish
- (upcoming) pin timestamps while recording

## Supported Codecs/File Formats:
- aac/m4a
- opus&vorbis/webM
- pcm/wav (building...)
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


## Reference
- Recorder:
    - common method: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
    - method adopted here: 
        - WebCodecs
        - AudioContext: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
- webM, which is a strict mode of matroska:
    - codec: https://www.matroska.org/technical/codec_specs.html
- packaging: https://github.com/davedoesdev/webm-muxer.js, https://github.com/Vanilagy/webm-muxer
