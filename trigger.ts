import '@std/dotenv/load'

const n = 276174

for (let i = 0; i < n; i += 2000) {
  const res = await fetch(
    'https://api.github.com/repos/dwng-ld/dldl/actions/workflows/main.yml/dispatches',
    {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${Deno.env.get('GH_TOKEN')}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(
        {
          'ref': 'master',
          'inputs': {
            'start': i.toString(),
            'end': (i + 2000).toString(),
          },
        },
      ),
    },
  )
  console.log(`${i}-${i}: ${res.status} ${res.statusText}`)
  if (res.status !== 200) {
    console.error(await res.text())
  }
}
