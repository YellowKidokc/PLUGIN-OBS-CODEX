import os
import subprocess


def start_tunnel() -> None:
    token = os.getenv("CLOUDFLARE_TOKEN")
    if not token:
        raise ValueError("CLOUDFLARE_TOKEN is required to start a tunnel")

    subprocess.Popen(["cloudflared", "tunnel", "run", "--token", token])
