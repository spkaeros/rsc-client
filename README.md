Rusty RSC client
================
**Disclaimer: I do manual testing and ensure it all _looks and feels_ right after any major commit that I make**
**I made no attempt to ensure _1:1 semantically matching_ behavior when comparing this clients behavior against the official client**

Javascript Codebase
===================
Forked from: @misterhat's [**RSClassic mudclient_204_** javascript port](https://github.com/2003scape/rsc-client)
**Without his work, I wouldn't have even started to work on anything like this project.**
He did the initial porting work of the Java mc204 to Javascript.  He had ported the codebase exactly as it sat in Java, which worked perfectly, but I wanted more.
Improving, modernizing, refactoring, learning...
------------------------------------------------
I picked MisterHat's Javascript port up and I tweaked and hacked at it endlessly whenever I was bored in the name of performance improvements, and refactorization to modern techniques.
This was kind of my Javascript crash course at first, as I was coming from a very non-web development background (mainly Java, PHP, Go, C, some C++, and minor experience in some others not really worth mentioning).
After some time, and some performance monitoring with JS profilers, I realized I would need to change some of the guts of the client if I was to see any real meaningful speed ups, and that was something that I was really after since my CPU was just not keeping up sometimes, sadly (at the time, at least).  Modern PCs ran it fine obviously, but I was not running a modern PC, just an old old desktop from pre-08 that had been through a lot with me.

## Rusting the project up a little?
The natural next step once I had realized this was for me to port parts of the client that my profiler indicated were taking most of my CPU time up into a faster programming environment by leveraging WASM as a target, then call into that environment from the JS code.
This is where I am at with the project at present.
I chose Rust as it is probably one of the best language projects I've found in all of my research of computer languages.  Zero-cost abstractions for almost anything, high-performance LLVM based tooling with speed rivaling top C implementations, inherent memory safety, amazingly powerful type system...Rust has it all, it seems.

I will be working on porting the non performance critical calls too, if it turns out that I like Rust as much as I think and may eventually wind up with a full Rust client on my hands (this is my current goal, if nothing in my opinions here change during development).

*I do _not_ recommend trying to use this for anything beyond academic curiosity _at this moment_; I often have small issues left unbroken between large commits*
_If you are familiar with Rust/WASM and JS environment interoperations or with porting JS to Rust or just wanting to learn some new things by doing rather than by reading, feel free to help me porting parts of the client_
