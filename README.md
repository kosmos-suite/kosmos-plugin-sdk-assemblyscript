# @kosmos-suite/plugin-sdk-assemblyscript

Shared guest-side runtime for [Kosmos](https://github.com/kosmos-suite/kosmos) WASM plugins written
in AssemblyScript — the pointer/length-packed-into-i64 ABI, host-memory `alloc`/`dealloc`, and the
permission-scoped `env.http_fetch` host import every plugin gets. Mirrors the Rust and Go SDKs.

A new plugin depends on it like any [npm package](https://www.npmjs.com/package/@kosmos-suite/plugin-sdk-assemblyscript):

```shell
npm install @kosmos-suite/plugin-sdk-assemblyscript
```

and, at minimum:

```typescript
export { alloc, dealloc } from "@kosmos-suite/plugin-sdk-assemblyscript/assembly/index";
import { readString, writeString } from "@kosmos-suite/plugin-sdk-assemblyscript/assembly/index";

export function myExport(argPtr: i32, argLen: i32): i64 {
  const arg = readString(argPtr, argLen);
  return writeString(`got: ${arg}`);
}
```

`alloc`/`dealloc` must be re-exported (not just imported and called) from the guest's own entry
file — that's what makes them real WASM exports the host can call.

Compile with `--runtime stub` (a bump allocator; no GC needed for short-lived per-call buffers):

```shell
npx asc assembly/index.ts --target release --runtime stub --outFile build/plugin.wasm
```

See [kosmos-plugin-examples](https://github.com/kosmos-suite/kosmos-plugin-examples)'s `ping-as`
for a full working guest built on this SDK.
