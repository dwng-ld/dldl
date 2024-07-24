/// <reference lib="webworker" />

import { chunkStream } from './split-stream.ts'
import { StreamFormData2 } from './stream-form-data.ts'

const ports = [
  9000,
  9001,
  9002,
  9003,
  9004,
  9005,
  9006,
  9007,
]

export type Output = {
  ids: string[]
  path: string
} | 'error'

const client = Deno.createHttpClient({
  proxy: {
    url: `socks5h://127.0.0.1:${
      ports[Math.floor(Math.random() * ports.length)]
    }`,
  },
})

const upload = async (
  stream: ReadableStream<Uint8Array>,
  path: string,
): Promise<string> => {
  const formData = new StreamFormData2()

  formData.add('file', {
    stream: stream,
    mimeType: 'application/octet-stream',
    fileName: path,
  })
  const exported = formData.exportData()

  const json = await fetch('https://api.end2end.tech/upload', {
    method: 'POST',
    headers: exported[0],
    body: exported[1],
  }).then((res) => res.json())

  return json.FileID
}
self.addEventListener('message', async ({ data: path }: { data: string }) => {
  try {
    const res = await fetch(
      `http://ro4h37fieb6oyfrwoi5u5wpvaalnegsxzxnwzwzw43anxqmv6hjcsfyd.onion/dwango/${path}`,
      { client },
    )
    const rawStream = res.body
    if (!rawStream) {
      throw new TypeError('Body is null')
    }

    const ids: string[] = []
    // Split stream with 1048MB
    for await (const chunk of chunkStream(rawStream, 1)) {
      const id = await upload(chunk, `${Math.random()}-${path}`)
      ids.push(id)
    }

    self.postMessage(
      {
        ids,
        path,
      } satisfies Output,
    )
  } catch (e) {
    console.error(e)
    self.postMessage('error' satisfies Output)
  }
})