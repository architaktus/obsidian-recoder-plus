## Obsidian Recorder Plus
This plugin provide a better recorder in Obsidian
- just record, you could pause and stop
- more than record, with configs and more

## Features
- from native WebAPI feature, clean and save:
    - use audioContext as Method, **NO MOEW BitRate limit**!
    - adopt newest WebCodecs as encoder, your Recording has correct and accurate duration info now (which means **SEEKABLE**)!
- open in Obsidian's sidebar with more control options (PC: with hover editor you could also hover it.)
- more than native recorder, you could configure the quality, could **CONTROL** the recording (e.g. pause, resume, set timeout..)
- rename and save to other places as wish
- (upcoming) pin timestamps while recording

## Demo
TODO

## TODO
* [ ] mobile version & different platforms
* [ ] ribbon icon
* [ ] better UI


## Reference
- Recorder:
    - common method: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
    - method adopted here: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
- webM, which is a strict mode of matroska:
    - codec: https://www.matroska.org/technical/codec_specs.html
- https://github.com/davedoesdev/webm-muxer.js, https://github.com/Vanilagy/webm-muxer
