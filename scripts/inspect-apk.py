"""Inspect an Android release APK without installing SDK tools or dependencies."""
import collections
import pathlib
import struct
import sys
import zipfile


def inspect(apk):
    failures = []
    totals = collections.Counter()
    architectures = set()
    libraries = 0
    with zipfile.ZipFile(apk) as archive, open(apk, "rb") as raw:
        if archive.testzip():
            failures.append("APK has a corrupt ZIP entry")
        for entry in archive.infolist():
            name = entry.filename
            totals[name.split("/")[0]] += entry.compress_size
            if "barhopper" in name or "mlkit_barcode" in name:
                failures.append(f"Unused barcode scanner packaged: {name}")
            if not name.startswith("lib/") or not name.endswith(".so"):
                continue
            architecture = name.split("/")[1]
            architectures.add(architecture)
            libraries += 1
            if architecture not in ("arm64-v8a", "x86_64"):
                continue
            data = archive.read(entry)
            if data[:5] != b"\x7fELF\x02":
                failures.append(f"Expected a 64-bit ELF library: {name}")
                continue
            endian = "<" if data[5] == 1 else ">"
            offset = struct.unpack_from(endian + "Q", data, 32)[0]
            size, count = struct.unpack_from(endian + "HH", data, 54)
            for index in range(count):
                segment = offset + index * size
                kind = struct.unpack_from(endian + "I", data, segment)[0]
                alignment = struct.unpack_from(endian + "Q", data, segment + 48)[0]
                if kind == 1 and alignment < 16384:
                    failures.append(f"ELF segment lacks 16 KB alignment: {name}")
                    break
            if entry.compress_type == zipfile.ZIP_STORED:
                raw.seek(entry.header_offset + 26)
                name_length, extra_length = struct.unpack("<HH", raw.read(4))
                data_offset = entry.header_offset + 30 + name_length + extra_length
                if data_offset % 16384:
                    failures.append(f"Uncompressed library lacks 16 KB ZIP alignment: {name}")
        if "assets/index.android.bundle" not in archive.namelist():
            failures.append("Embedded JavaScript bundle is missing")
    if not libraries:
        failures.append("No native libraries packaged")
    print(f"{apk.name}: {apk.stat().st_size / 1048576:.2f} MiB")
    print(f"Architectures: {', '.join(sorted(architectures))}; native libraries: {libraries}")
    for group, size in totals.most_common(5):
        print(f"  {group}: {size / 1048576:.2f} MiB")
    if failures:
        raise SystemExit("\n".join(failures))
    print("ZIP integrity, embedded bundle, scanner exclusion, and 64-bit 16 KB alignment: OK")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python3 scripts/inspect-apk.py path/to/release.apk")
    inspect(pathlib.Path(sys.argv[1]))
