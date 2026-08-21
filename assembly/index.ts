// Shared guest-side runtime for Kosmos WASM plugins written in AssemblyScript: the
// pointer/length-packed-into-i64 ABI, host-memory alloc/dealloc, and the permission-scoped
// env.http_fetch host import every plugin gets. Mirrors kosmos-plugin-sdk's Rust crate.
//
// Compile guests with `--runtime stub` (a bump allocator, no GC needed for short-lived
// per-call buffers) — __alloc/__free/__new below come from that runtime and are available
// globally without an import once it's selected.

@external("env", "http_fetch")
declare function host_http_fetch(ptr: i32, len: i32): i64;

export function pack(ptr: i32, len: i32): i64 {
  return (<i64>len << 32) | (<i64>ptr & 0xFFFFFFFF);
}

export function unpackPtr(packed: i64): i32 {
  return <i32>packed;
}

export function unpackLen(packed: i64): i32 {
  return <i32>(packed >>> 32);
}

// Wraps the stub runtime's own __alloc/__free (raw, headerless allocation) under the exact
// names/signatures the Java host calls — a guest's entry file must re-export these:
//   export { alloc, dealloc } from "kosmos-plugin-sdk/assembly/index";
export function alloc(len: i32): i32 {
  if (len <= 0) return 0;
  return <i32>__alloc(<usize>len);
}

export function dealloc(ptr: i32, len: i32): void {
  if (ptr == 0) return;
  __free(<usize>ptr);
}

export function readString(ptr: i32, len: i32): string {
  return String.UTF8.decodeUnsafe(<usize>ptr, <usize>len, false);
}

export function writeString(s: string): i64 {
  const buf = String.UTF8.encode(s, false);
  return pack(<i32>changetype<usize>(buf), buf.byteLength);
}

// Calls the host's permission-scoped http_fetch import. Returns either the real response body
// (host allowed the URL's host) or the host's own "blocked:<host>"/"error:..." text.
export function httpFetch(url: string): string {
  const urlBuf = String.UTF8.encode(url, false);
  const packed = host_http_fetch(<i32>changetype<usize>(urlBuf), urlBuf.byteLength);
  return readString(unpackPtr(packed), unpackLen(packed));
}
