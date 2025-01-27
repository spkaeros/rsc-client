import PCMPlayer from './lib/pcm-player';
import { mulaw } from 'alawmulaw';

class StreamAudioPlayer {
    constructor() {
        this.player = new PCMPlayer({
            encoding: '16bitInt',
            channels: 1,
            sampleRate: 8000
        });
    }

    stopPlayer() {
        this.player.destroy();
    }

    writeStream(buffer, offset, length) {
        const decoded = mulaw.decode(new Uint8Array(buffer.slice(offset, offset + length)));
        this.player.feed(decoded);
    }
}

export { StreamAudioPlayer as default };
