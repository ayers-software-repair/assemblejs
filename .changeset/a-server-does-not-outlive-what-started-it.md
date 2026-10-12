---
"@assemblejs/cli": patch
---

`dev` and `perf` take the server they started with them however they end. Stopped by a signal, the command line already stopped its server. Killed outright, it runs no line of its own, and the server was left listening on its port for as long as the machine stayed up. The server's process now ends when the command line's is gone: it is started with a channel to the process that started it and ends when that channel closes.
