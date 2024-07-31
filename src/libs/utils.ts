export async function downloadBuffer(url: string) {
  const req = await fetch(url);
  const ab = await req.arrayBuffer();
  const buffer = new Uint8Array(ab);

  return buffer;
}
