#!/bin/sh
# WHY entrypoint script: The /data volume may have been created by a previous
# root-running container. This script fixes ownership so the non-root tscribe
# user can read/write the SQLite database and job directories.
chown -R tscribe:tscribe /data 2>/dev/null || true
exec gosu tscribe "$@"
