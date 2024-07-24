import { join } from '@std/path'

await Deno.mkdir('.tor', { recursive: true })
await Deno.mkdir('.tor/torrc', { recursive: true })
await Deno.mkdir('.tor/data', { recursive: true })

// kill current tor process
await new Deno.Command('pkill', {
  args: [
    '-9',
    'tor',
  ],
}).output()

for (let i = 0; i < 8; i++) {
  const torrcPath = join(Deno.cwd(), `.tor/torrc/torrc-${i}`)
  const torrc = `SocksPort ${9000 + i}\nDataDirectory ${
    join(Deno.cwd(), '.tor/data', i.toString())
  }`
  await Deno.writeTextFile(torrcPath, torrc)
  const command = new Deno.Command('tor', {
    args: [
      '-f',
      torrcPath,
    ],
    stdout: 'null'
  })
  console.log(command.spawn())
}
Deno.exit(0)