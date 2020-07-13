# rusty rsc-client

* Disclaimer: I made no attempts to ensure 1:1 semantical replication, though after each major portion of client is changed I do manual testing and ensure it all seems right. *

More or less, each portion of client that got massive rewrites, was my approach instead of whatever approach had been used before from the original code. 
The obfuscator hurt a lot of areas of code within the client source, and I had deemed areas completely fucked for any human reader for a very long time, and always desired a
client version that had modern implementations of the things in the client in place.  Since this is using web technologies, the areas needing a boost in performance over traditional
Javascript environment capabilities have been rewritten into Rust and are compiled to wasm for deployment.

This approach seems to massively improve runtime performance while also being one of the simplest ways to achieve this goal.
WebGL rendering backend is an eventual goal also, but the important part for me at least for now remains to create a readable, performant RSC client which runs well in any modern browser,
using modern coding techniques.  This project is largely an experiment and I hope it eventually is done but _I promise nothing_.

A highly liberal port of the
[Runescape Classic](https://en.wikipedia.org/wiki/RuneScape#History_and_development) client
([*mudclient revision 204*](https://github.com/2003scape/mudclient204))
from Java to Javascript+Rust(WASM), with major portions of the client rewritten, clarified, modernized and/or otherwise improved upon extensively.

Forked from: [MisterHat's 204 javascript client port](https://github.com/2003scape/rsc-client)
Without his work, I wouldn't have ever begun to be interested in doing this.

_I do not recommend trying to use this for anything beyond academic curiousity at this moment, or if you are familiar with Rust/wasm and JS interop, feel free to help me finish it_
