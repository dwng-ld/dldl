export async function* chunkStream(
    stream: ReadableStream<Uint8Array>,
    chunkSizeMB: number,
  ): AsyncIterableIterator<ReadableStream<Uint8Array>> {
    const chunkSizeBytes = chunkSizeMB * 1024 * 1024
    let currentChunkSize = 0
    let chunkBuffers: Uint8Array[] = []
  
    const reader = stream.getReader()
  
    while (true) {
      const { done, value } = await reader.read()
  
      if (done) {
        if (chunkBuffers.length > 0) {
          yield new ReadableStream({
            start(controller) {
              for (const buffer of chunkBuffers) {
                controller.enqueue(buffer)
              }
              controller.close()
            },
          })
        }
        break
      }
  
      if (currentChunkSize + value.byteLength > chunkSizeBytes) {
        const remainingBytes = chunkSizeBytes - currentChunkSize
        chunkBuffers.push(value.slice(0, remainingBytes))
        currentChunkSize = 0
  
        yield new ReadableStream({
          start(controller) {
            for (const buffer of chunkBuffers) {
              controller.enqueue(buffer)
            }
            controller.close()
          },
        })
  
        chunkBuffers = [value.slice(remainingBytes)]
        currentChunkSize = value.byteLength - remainingBytes
      } else {
        chunkBuffers.push(value)
        currentChunkSize += value.byteLength
      }
    }
  }