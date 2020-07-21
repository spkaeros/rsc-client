# Rusty RSC client
*Disclaimer: I do manual testing and ensure it all _looks and feels_ right after any major commit that I make*
**I made no attempt to ensure _1:1 semantically matching behavior_ when comparing this clients behavior against the official client**

## Javascript Codebase
	Forked from: *MisterHat's* [mudclient204 javascript port](https://github.com/2003scape/rsc-client)
	_Without his work, I wouldn't have ever started to do this project._
	He did the initial porting work of the Java mc204 to Javascript.  He had ported the codebase exactly as it sat in Java, which worked perfectly, but I wanted more.

## Improving, modernizing, refactoring, learning...
	I picked MisterHat's Javascript port up and I tweaked and hacked at it endlessly whenever I was bored in the name of performance improvements, and refactorization to modern techniques.
	This was kind of my Javascript crash course at first, as I was coming from a very non-web development background (mainly Java, PHP, Go, C, some C++, and minor experience in some others not really worth mentioning).
	After some time, and some performance monitoring with JS profilers, I realized I would need to change some of the guts of the client if I was to see any real meaningful speed ups, and that was something that I was really after since my CPU was just not keeping up sometimes, sadly (at the time, at least).  Modern PCs ran it fine obviously, but I was not running a modern PC, just an old old desktop from pre-08 that had been through a lot with me.

## Rusting the project up a little?
	The natural next step once I had realized this was for me to port parts of the client that my profiler indicated were taking most of my CPU time up into a faster programming environment by leveraging WASM as a target, then call into that environment from the JS code.
	This is where I am at with the project at present.
	I chose Rust as it is probably one of the best language projects I've found in all of my research of computer languages.  Zero-cost abstractions for almost anything, high-performance LLVM based tooling with speed rivaling top C implementations, inherent memory safety, amazingly powerful type system...Rust has it all, it seems.

	I will be working on porting the non performance critical calls too, if it turns out that I like Rust as much as I think and may eventually wind up with a full Rust client on my hands (this is my current goal, if nothing in my opinions here change during development).

More or less, each portion of client that got massive rewrites, was my approach instead of whatever approach had been used before from the original code.
The obfuscator hurt a lot of areas of code within the client source, and I had deemed areas completely fucked for any human reader for a very long time, and always desired a
client version that had modern implementations of the things in the client in place.  Since this is using web technologies, the areas needing a boost in performance over traditional
Javascript environment capabilities have been rewritten into Rust and are compiled to wasm for deployment.

This approach seems to massively improve runtime performance while also being one of the simplest ways to realize my end-goal.
WebGL rendering backend is an eventual goal also, but the important part for me at least for now remains to create a readable, performant RSC client which runs well in any modern browser,
using modern coding techniques.  This project is largely an experiment and I hope it eventually is done but _I promise nothing_.

A highly liberal port of the [Runescape Classic](https://en.wikipedia.org/wiki/RuneScape#History_and_development) ([*revision 204*](https://github.com/2003scape/mudclient204)) client
from Java to Javascript+Rust(WASM), with major portions of the client rewritten, clarified, modernized and/or otherwise improved upon extensively.

*I do _not_ recommend trying to use this for anything beyond academic curiosity _at this moment_; I often have small issues left unbroken between large commits*
_If you are familiar with Rust/WASM and JS environment interoperations or with porting JS to Rust or just wanting to learn some new things by doing rather than by reading, feel free to help me porting parts of the client_
