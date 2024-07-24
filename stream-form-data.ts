// FormData but with stream

type Data = string | File | {
    stream: ReadableStream<Uint8Array>
    mimeType: string
    fileName: string
  }
  
  type Data2 = string | {
    stream: ReadableStream<Uint8Array>
    mimeType: string
    fileName: string
  }
  export class StreamFormData {
    #data: [string, Data][] = []
  
    add(key: string, value: Data) {
      this.#data.push([key, value])
    }
    toReadableStream(): [stream: ReadableStream<Uint8Array>, boundary: string] {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  
      const data = this.#data
      const encoder = new TextEncoder()
  
      const createStartBoundary = () => encoder.encode(`${boundary}\r\n`)
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          for (const [key, value] of data) {
            controller.enqueue(createStartBoundary())
            if (typeof value === 'string') {
              controller.enqueue(encoder.encode(`Content-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`))
            } else if (value instanceof File) {
              controller.enqueue(encoder.encode(`Content-Disposition: form-data; name="${key}"; filename="${value.name}"\r\n`))
              controller.enqueue(encoder.encode(`Content-Type: ${value.type}\r\n\r\n`))
            } else {
              const { stream, mimeType, fileName } = value
              controller.enqueue(encoder.encode(`Content-Disposition: form-data; name="${key}"; filename="${fileName}"\r\n`))
              controller.enqueue(encoder.encode(`Content-Type: ${mimeType}\r\n\r\n`))
              for await (const chunk of stream) {
                controller.enqueue(chunk)
              }
              controller.enqueue(encoder.encode('\r\n'))
            }
            controller.enqueue(encoder.encode(`${boundary}--\r\n`))
          }
          controller.close()
        }
      })
  
      return [stream, boundary]
    }
  }
  
  interface StreamFormData2Inf {
    add(k: string, v: Data): void;
    exportData(): [headers: Headers, stream: ReadableStream<Uint8Array>];
  }
  
  export class StreamFormData2 implements StreamFormData2Inf {
    private boundary: string;
    private parts: { name: string; data: Data2 }[];
  
    constructor() {
      this.boundary = this.generateBoundary();
      this.parts = [];
    }
  
    add(k: string, v: Data2): void {
      this.parts.push({ name: k, data: v });
    }
  
    exportData(): [headers: Headers, stream: ReadableStream<Uint8Array>] {
      const headers = new Headers({
        'Content-Type': `multipart/form-data; boundary=${this.boundary}`
      });
  
      const stream = new ReadableStream<Uint8Array>({
        start: async controller => {
          for (const part of this.parts) {
            const { name, data } = part;
            if (typeof data === 'string') {
              this.enqueueStringPart(controller, name, data);
            } else {
              await this.enqueueStreamPart(controller, name, data);
            }
          }
          controller.enqueue(this.encoder().encode(`--${this.boundary}--\r\n`));
          controller.close();
        }
      });
  
      return [headers, stream];
    }
  
    private enqueueStringPart(controller: ReadableStreamDefaultController<Uint8Array>, name: string, value: string) {
      const partHeader = `--${this.boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`;
      controller.enqueue(this.encoder().encode(partHeader));
    }
  
    private async enqueueStreamPart(controller: ReadableStreamDefaultController<Uint8Array>, name: string, data: { stream: ReadableStream<Uint8Array>; mimeType: string; fileName: string }) {
      const partHeader = `--${this.boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${data.fileName}"\r\nContent-Type: ${data.mimeType}\r\n\r\n`;
      controller.enqueue(this.encoder().encode(partHeader));
  
      const reader = data.stream.getReader();
      let done, value;
      while ({ done, value } = await reader.read(), !done) {
        controller.enqueue(value);
      }
      controller.enqueue(this.encoder().encode('\r\n'));
    }
  
    private encoder() {
      return new TextEncoder();
    }
  
    private generateBoundary(): string {
      return '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 24);
    }
  }