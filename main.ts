import type { Output } from './worker.ts'

const [from, to] = Deno.args.map(s => parseInt(s))

const queues = (await Deno.readTextFile('result.csv')).split('\n').slice(from, to)
  .filter(s => s.endsWith('file'))
  .map(s => s.split(',')[0])

const len = queues.length
console.log('Inited queues')

const workers = [...Array(32)].map(() => new Worker(import.meta.resolve('./worker.ts'), { type: 'module' }))

console.log('Inited Workers')

const result: {
  path: string
  ids: string[]
}[] = []

let i = 0
let last = performance.now()
for (const worker of workers) {
  const next = () => {
    const path = queues.shift()
    if (!path) {
      worker.terminate()
      return
    }
    worker.postMessage(path)
  }
  worker.onmessage = async ({ data }: { data: Output }) => {
    if ('error' in data) {
      queues.push(data.path)
      setTimeout(() => next(), 100)
      return
    }
    i++
    console.log(`${i} / ${len} (${Math.round(i / (len) * 1000000) / 10000}%), ${(i % 10) / (performance.now() - last) * 1000}it/s`)
    if (i % 10 === 0) {
      last = performance.now()
    }
    if (i === len) {
      await Deno.writeTextFile('result.jsonl', result.map(r => JSON.stringify(r)).join('\n'))
      Deno.exit(0)
    }
    result.push({
      path: data.path,
      ids: data.ids
    })
    next()
  }
  next()
}
