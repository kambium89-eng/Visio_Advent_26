#!/usr/bin/env python3
"""Credential/file safety gate; prints locations, never matching secret values."""
from pathlib import Path
import re
import subprocess
import sys

root=Path(__file__).resolve().parents[1]
files=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0')
failures=[]
literal=re.compile(r'''(?i)(?:team[_-]?password|admin[_-]?password|session[_-]?secret|db[_-]?(?:password|pass)|database[_-]?(?:url|password)|password[_-]?hash|(?:session|data|edit|rate|backup)[_-]?key|turnstile[_-]?secret|login[_-]?username)\s*["']?\s*[:=]\s*["']([^"'\n]{4,})["']''')
credential_url=re.compile(r'(?i)(?:mysql|mariadb|postgres(?:ql)?|https?)://[^\s/:]+:[^\s/@]+@')
bad_name=re.compile(r'(?i)(?:^|/)(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?|.*\.(?:pem|key|sqlite3?|db|vab)|(?:backup|dump).*\.(?:sql|gz|zip|tar|json)|(?:credentials|secrets).*\.(?:json|txt|md|toml|ya?ml))$')
private_directory=re.compile(r'(?i)(?:^|/)(?:private|backups|node_modules|\.wrangler)/')
for name in files:
    if not name: continue
    path=root/name
    if not path.is_file(): continue
    if (bad_name.search(name) or private_directory.search(name)) and not name.endswith('.example'):
        failures.append((name,0,'private runtime file tracked'))
    if name.endswith('.sql') and name not in {'backend/drizzle/0000_harsh_carlie_cooper.sql'}:
        failures.append((name,0,'unexpected SQL file; review for database contents'))
    if path.stat().st_size > 3000000: continue
    raw=path.read_bytes()
    if b'\0' in raw: continue
    for number,line in enumerate(raw.decode('utf8',errors='replace').splitlines(),1):
        if re.search(r'-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----',line):
            failures.append((name,number,'private key'))
        candidates=list(literal.finditer(line))
        # These exact fixture values and the public KDF-format prefix are not credentials.
        safe_fixtures={'TEST_ONLY_TEAM','test-team','test-admin','test-only-secret','preview','preview-test-only','pbkdf2-sha256$600000$'}
        unsafe=any(match.group(1) not in safe_fixtures or (not name.startswith('backend/server/api.test.mjs') and match.group(1)!='pbkdf2-sha256$600000$') for match in candidates)
        if unsafe or credential_url.search(line):
            failures.append((name,number,'literal credential candidate'))
for name,number,reason in failures:
    print(f'{name}:{number}: {reason}',file=sys.stderr)
if failures: raise SystemExit(1)
print('Tracked files contain no blocked secret assignments or runtime-data filenames.')
