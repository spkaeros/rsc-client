import Packet from './packet';

class NetworkStream extends Packet {
    constructor(socket) {
        super();
        this.closing = false;
        this.closed = false;
        this.socket = socket;
    }

    closeStream() {
        this.closing = true;
        this.socket.close();
        this.closed = true;
    }

    async readStream() {
        if (this.closed)
            return 0;

        return await this.socket.readByte();
    } 

    availableStream() {
        if (this.closed)
            return 0;

        return this.socket.available();
    }

    async readStreamBytes(len, off, buff) {
        if (this.closed)
            return;

        await this.socket.readBytes(buff, off, len);
    }

    writeStreamBytes(buff, off, len) {
        if (this.closing || this.closed)
            return;

        this.socket.write(buff, off, len);
    }
}

export { NetworkStream as default };
