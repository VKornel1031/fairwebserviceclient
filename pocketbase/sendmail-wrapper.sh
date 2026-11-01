#!/bin/sh
# Installed by setup-local-sendmail.py. Read the sender from PocketBase's From header.
set -eu
busybox=/bin/busybox
server=__FAIRAUTO_MAIL_SERVER__
address='[A-Za-z0-9][A-Za-z0-9._%+-]*@[A-Za-z0-9][A-Za-z0-9.-]*\.[A-Za-z]{2,}'
[ "$#" -gt 0 ] || { echo 'Missing mail recipient.' >&2; exit 64; }
for recipients in "$@"; do
  case "$recipients" in
    *[!A-Za-z0-9._%+@,-]*) echo 'Invalid mail recipient.' >&2; exit 64 ;;
  esac
  printf '%s\n' "$recipients" | "$busybox" grep -Eq "^${address}(,${address})*$" || {
    echo 'Invalid mail recipient.' >&2; exit 64;
  }
done
umask 077
message=$("$busybox" mktemp /tmp/fairauto-mail.XXXXXX)
trap 'rm -f "$message"' EXIT HUP INT TERM
# PocketBase supplies CRLF headers; BusyBox adds CRLF itself when sending.
# Feed it Unix lines so the SMTP receiver never sees CRCRLF/bare CR headers.
"$busybox" sed 's/\r$//' > "$message"
sender=$("$busybox" awk '/^\r?$/ { exit } /^[Ff][Rr][Oo][Mm]:/ { sub(/^[^:]*:[ \t]*/, ""); sub(/\r$/, ""); print; exit }' "$message")
case "$sender" in
  *'<'*'>'*) sender=${sender##*<}; sender=${sender%%>*} ;;
esac
printf '%s\n' "$sender" | "$busybox" grep -Eq "^${address}$" || {
  echo 'Invalid or missing mail sender.' >&2; exit 64;
}
"$busybox" sendmail -w 45 -S "$server" -f "$sender" "$@" < "$message"
