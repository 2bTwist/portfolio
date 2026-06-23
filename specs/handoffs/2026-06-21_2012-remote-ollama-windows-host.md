---
date: 2026-06-22T00:12:59Z
git_commit: a76c5c8
branch: main
repository: portfolio
topic: "Set up a hardened remote Ollama inference host on a Windows laptop, driven headless from the Mac over SSH"
tags: [handoff, ollama, ssh, windows-host, local-ai, security-hardening]
status: done
last_updated: 2026-06-22
type: handoff
---

# Handoff: Remote Ollama host on Windows laptop (win153), hardened + headless

## RESOLUTION (2026-06-22) — DONE, working + verified
- **Final model: `gptoss20b-abl:mxfp4`** = `huihui-ai/Huihui-gpt-oss-20b-mxfp4-abliterated-v2` (abliterated gpt-oss-20B, MoE 3.6B active, mxfp4 native = full quality). 12.85 GB GGUF imported via Modelfile (`FROM C:\ollama\gptoss20b-abl.gguf`). **~18 tok/s, correct code, fits RAM (no swap).**
- **REJECTED: the dense 27B** (`Huihui-Qwen3.6-27B-abliterated-MTP-GGUF` Q4_K, 15.7 GB). Empirically **0.37 tok/s** because it overflows 16 GB RAM → ~27 GB pagefile thrash. Lesson: **this box (16 GB RAM + 6 GB VRAM) cannot run a dense 27B; it needs MoE (few active params) or a ≤14B dense.** Downloaded model + source deleted.
- **Ollama install:** v0.30.9 at `C:\Users\rbatc\AppData\Local\Programs\Ollama\ollama.exe`.
- **Headless service:** scheduled task `OllamaServe` runs `ollama serve` as **SYSTEM at startup** (survives logout + closed lid). Machine env: `OLLAMA_HOST=127.0.0.1:11434` (localhost-only, verified via netstat), `OLLAMA_MODELS=C:\ollama\models`.
- **Mac tunnel:** SSH alias `win153-ollama` in `~/.ssh/config` (LocalForward 11435→127.0.0.1:11434). Usage: `ssh -f -N win153-ollama` then point clients at `http://127.0.0.1:11435/v1`. Verified end-to-end from Mac.
- **gpt-oss usage note:** it's a reasoning model (harmony). Use `/api/chat` with `"think":"low"` (or medium) to keep reasoning in the separate `message.thinking` channel; otherwise reasoning leaks into `/api/generate` `response`.
- **Close-the-lid:** YES while plugged into AC (no-sleep is AC-only; SYSTEM service is not login-tied). On battery it sleeps and Wi-Fi has no Wake-on-LAN → unreachable. Keep it plugged in.


## Task(s)
Goal: run local coding models on a beefier Windows laptop (RTX 3060) instead of the 16 GB M4 Mac, driving it headless from the Mac, fully local (LAN only), security-hardened.

- **DONE — SSH remote control** of the Windows laptop from the Mac, key-only, verified.
- **DONE — Security hardening** of the connection (see Learnings).
- **DONE — Mac-side hardening** (firewall + stealth on, verified).
- **IN PROGRESS — Ollama install on the Windows host.** NOT yet installed. winget install was about to run, then user paused for hardening. Hardening now complete.
- **PLANNED — Model choice.** User said "Don't download the model yet I'll tell you which to download." They excluded Qwen and Ollama-only framing; want best *coding* model. Awaiting their pick.
- **ABANDONED — earlier model swaps on the Mac** (gemma4:e4b ↔ huihui Qwen3.5-4B abliterated). Fully reverted/cleaned up; ignore.

## Critical References
- `~/local-ai-stack.md` — the Mac's local AI stack doc (reverted to gemma4:e4b as primary; Pi config lives there).
- `~/.ssh/config` lines for `Host win153` (the pinned SSH alias for the Windows box).
- Primary-source model research (in conversation): for a 16 GB-class box, gpt-oss-20B and Phi-4 14B were the non-Qwen front-runners; on THIS Windows box (6 GB VRAM + 16 GB RAM + CUDA) the calculus is better.

## Recent changes
Mac-side files:
- `~/.ssh/config` — added `Host win153` block (HostName 192.168.1.153, User rbatc, IdentityFile ~/.ssh/win153_ollama, IdentitiesOnly yes, ForwardAgent no, ForwardX11 no).
- `~/.ssh/win153_ollama` + `.pub` — dedicated ed25519 keypair (NO passphrase, so the agent can drive non-interactively).
- macOS Application Firewall: enabled (State=1) + stealth mode on (verified).
- `~/local-ai-stack.md` — reverted to gemma4:e4b as the single Ollama model (earlier swap undone).
- `~/.pi/agent/models.json` + `settings.json` — reverted to gemma4:e4b (also fixed pre-existing drift where defaultModel pointed at uninstalled qwen2.5-coder:7b).
- `~/Library/Mobile Documents/com~apple~CloudDocs/win153-ssh-setup.ps1` — the bootstrap script (can delete; job done).

Windows host (192.168.1.153) changes, all via SSH:
- OpenSSH Server installed (via Add-WindowsCapability, after winget fallback was prepped but not needed), running, auto-start.
- `C:\ProgramData\ssh\sshd_config` — PasswordAuthentication no, KbdInteractiveAuthentication no, PubkeyAuthentication yes, AllowUsers rbatc. Backup at `sshd_config.bak`.
- `C:\ProgramData\ssh\administrators_authorized_keys` — Mac pubkey with `from="192.168.1.185"` prefix; ACL locked to Administrators+SYSTEM.
- Firewall rule `sshd` — RemoteAddress restricted to 192.168.1.185 only.
- Power: AC sleep+hibernate disabled, lid-close = do nothing (AC).

## Learnings
- **Windows host specs:** Win 11 Home (build 26200), 16 GB RAM, Ryzen 7 5800H, **NVIDIA RTX 3060 Laptop, 6 GB VRAM, driver 596.21 (CUDA-ready)**. winget available. User = `rbatc` (admin). On **Wi-Fi** (Native 802.11, MAC E0-0A-F6-4C-F3-AF).
- **Windows OpenSSH password-auth gotcha:** `PasswordAuthentication no` is NOT enough — password logins ride `keyboard-interactive` on Windows, so you also need `KbdInteractiveAuthentication no`. Verified by `ssh -o PubkeyAuthentication=no` showing only `(publickey)` after the fix.
- **Wake-on-LAN won't work** — adapter is Wi-Fi; WoL is wired-only. Mitigation applied: never sleep, so keep it powered + plugged and it's always reachable. (no-sleep is AC-only; on battery it still sleeps.)
- **Driving Windows over SSH:** default shell is cmd. Run PowerShell via `powershell -NoProfile -EncodedCommand <base64 UTF-16LE>` to avoid quoting hell. Encode on Mac: `printf '%s' "$PS" | iconv -f UTF-8 -t UTF-16LE | base64 | tr -d '\n'`. Filter noise with `tr -d '\r' | grep -av "CLIXML\|<Objs\|^$"`. My SSH session runs **elevated** (admin token), so firewall/service/config edits work directly.
- **macOS `timeout` doesn't exist** — use ssh's `-o ConnectTimeout` + `ServerAliveInterval/CountMax` instead. `powercfg /devicequery wake_armed` and the WoL cmdlet can hang the SSH call; avoid them.
- **Security model agreed with user:** treat the Windows box as potentially hostile. SSH is one-directional (Mac→Win); never auto-exec remote/model output on the Mac; no agent forwarding; dedicated key. Ollama must be **localhost-bound + SSH-tunneled** (it has zero built-in auth — never expose 11434 on the LAN).
- **Source-quality lesson (user flagged hard):** don't trust AI-generated SEO blogspam (e.g. frankx.ai surfaced low-relevance in searxng). Use primary sources only: HF model cards, arxiv, official Ollama/vendor pages. Confirmed gpt-oss:20b GGUF is **14 GB** (tight on a 16 GB *Mac*, fine on the Windows box with GPU offload).

## Artifacts
- SSH alias: `ssh win153` (works, verified ~20:12).
- `~/.ssh/win153_ollama` (key), `~/.ssh/config` (win153 block).
- `~/local-ai-stack.md` (Mac stack doc).
- iCloud bootstrap script `win153-ssh-setup.ps1` (disposable).

## Action Items & Next Steps
1. **Get the model choice from the user** (they'll tell you). Non-Qwen, best coding. On this box (6 GB VRAM + 16 GB RAM + CUDA), good candidates: gpt-oss-20B (MoE, ~14 GB, strong coder, partial GPU offload), Phi-4 14B (~9 GB, comfortable), DeepSeek-Coder-V2-Lite (MoE, fast).
2. **Install Ollama on win153 securely** via `winget install --id Ollama.Ollama -e --accept-source-agreements --accept-package-agreements --silent`. Then:
   - Set `OLLAMA_HOST=127.0.0.1:11434` (localhost ONLY — do NOT set 0.0.0.0).
   - Run Ollama as a **headless service** (auto-start, no login). Default Windows Ollama is a user tray app; for true headless-without-login use a service wrapper (NSSM) or scheduled-task-at-startup running `ollama serve`.
   - Do NOT open a firewall rule for 11434.
3. **Pull the chosen model** on win153 (`ollama pull <model>`), GPU offload will use the 3060.
4. **Connect from the Mac via SSH tunnel:** `ssh -N -L 11435:127.0.0.1:11434 win153` (use 11435 because the Mac's own Ollama already uses 11434). Point Pi/clients at `http://127.0.0.1:11435/v1`. Consider adding a `win153-ollama` Host alias with `LocalForward 11435 127.0.0.1:11434`.
5. **Smoke test** tokens/sec + a coding prompt over the tunnel.

## Other Notes
- **User still owes:** confirm router does NOT port-forward 22 / 11434 to the internet. (Can't verify from here.)
- **Network:** Mac = 192.168.1.185 (en0; note default route is utun6/VPN but same-subnet LAN traffic is direct). Windows = 192.168.1.153. Subnet 192.168.1.0/24.
- **Recommend a DHCP reservation** for the Mac at .185 — both the firewall rule and the `from=` key restriction are pinned to it; if the Mac's IP changes, SSH to win153 breaks (fixable only at the Windows console).
- **Optional future hardening declined/deferred:** key passphrase (would break non-interactive automation), VLAN isolation of the Windows box.
- User prefs (hard rules): no Claude/Anthropic attribution anywhere; no em dashes; objective/no-sycophancy; warn-once-then-help on security topics; prefer searxng then primary sources.
