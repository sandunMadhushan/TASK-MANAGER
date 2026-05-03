/**
 * Update only `[package]` `version = "..."` in Cargo.toml.
 * A naive `^version=` regex can hit the wrong line or miss (e.g. tooling/CRLF); CI must only change the package version.
 */
export function setCargoPackageVersion(cargoToml, nextVersion) {
  const lines = cargoToml.split(/\r?\n/)
  const eol = cargoToml.includes('\r\n') ? '\r\n' : '\n'
  let inPackage = false
  let replaced = false
  const out = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('[')) {
      inPackage = trimmed === '[package]'
      out.push(line)
      continue
    }
    if (inPackage && /^\s*version\s*=/.test(line)) {
      const double = line.match(/^(\s*version\s*=\s*")([^"]*)(".*)$/)
      if (double) {
        out.push(`${double[1]}${nextVersion}${double[3]}`)
        replaced = true
        inPackage = false
        continue
      }
      const single = line.match(/^(\s*version\s*=\s*')([^']*)('.*)$/)
      if (single) {
        out.push(`${single[1]}${nextVersion}${single[3]}`)
        replaced = true
        inPackage = false
        continue
      }
      return null
    }
    out.push(line)
  }

  if (!replaced) {
    return null
  }

  const trailingNl = /(?:\r\n|\n)$/.test(cargoToml)
  return out.join(eol) + (trailingNl ? eol : '')
}
