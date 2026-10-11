const fs = require('node:fs');
const path = require('node:path');
const { Console } = require('node:console');
const { Writable } = require('node:stream');

// A GUI may outlive the terminal that launched it. A closed diagnostic pipe
// must not become an uncaught exception in Electron's internal IPC logging.
function protectProcessOutput() {
  for (const stream of [process.stdout, process.stderr]) {
    stream.on('error', error => {
      if (error.code !== 'EPIPE' && error.code !== 'ERR_STREAM_DESTROYED') throw error;
    });
  }
}

function routeConsoleToFile(filename) {
  let size = 0;
  try {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.appendFileSync(filename, `\n[${new Date().toISOString()}] ASTRA process started\n`);
    size = fs.statSync(filename).size;
  } catch { return false; }
  const output = new Writable({
    write(chunk, _encoding, done) {
      try {
        if (size + chunk.length > 1024 * 1024) {
          fs.writeFileSync(filename, '');
          size = 0;
        }
        fs.appendFileSync(filename, chunk);
        size += chunk.length;
      } catch {
        // A diagnostic write failure must not recursively invoke console.error.
      }
      done();
    },
  });
  global.console = new Console({ stdout: output, stderr: output, colorMode: false });
  return true;
}

module.exports = { protectProcessOutput, routeConsoleToFile };
