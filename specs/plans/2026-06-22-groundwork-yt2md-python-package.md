# Groundwork: yt2md single-file CLI → proper Python package — 2026-06-22

## Current state (5 bullets max)
- One executable file `~/bin/yt2md` (259 lines), stdlib-only, plus a sibling custom test harness `~/bin/test_yt2md.py` (16 assert-based cases, loads the module via `SourceFileLoader` because the script has no `.py` extension).
- Shells out to the external `yt-dlp` binary (assumed on `PATH`) via `subprocess.run` in `probe()` and `fetch_tracks()`; all other logic is pure.
- No packaging: not `pip`/`pipx`/`uv` installable, no `pyproject.toml`, no version, no console-script entry point, no dependency declaration.
- No type hints, no lint/format config, no CI; segments are bare 3-tuples `(secs, hms, text)`.
- Rendering and file I/O are fused: `write_markdown`/`write_json` build strings *and* write files, so output can't be unit-tested without temp files.

## Decisions (grilled 2026-06-22)
1. **Distribution = public GitHub repo under `2bTwist`** (new `~/Projects/yt2md`), pipx/uv-installable from git, with CI + README. **No PyPI yet** (deferred). [Q1]
2. **`yt-dlp` is a declared dependency**, invoked as `[sys.executable, "-m", "yt_dlp", ...]` (not bare `yt-dlp`) so we always use our venv's copy, never a stray PATH one. [Q2]
3. **CLI stays `argparse`**, isolated in `cli.py` (single-command tool; Typer deferred until a real second subcommand). [Q3]
4. **Performance is a first-class goal**: an `autoresearch` loop, every win gated by `rigor`, drives parse→markdown against a diverse transcript corpus. [Q4]
5. **Compiled hot path** (Rust/pyo3+maturin or mypyc) targeting ~tens-of-ns/segment, shipped as an **optional accelerator with a pure-Python fallback** so the tool stays installable everywhere. [Q5/Q6]
6. **Release/wheel distribution deferred** ("don't worry about release yet"): build + benchmark the extension locally; cibuildwheel / GitHub-Releases wheels are a later, optional step. The pure-Python fallback keeps `pipx install git+...` working without a build toolchain meanwhile. [Q6]

## Solutions surveyed
- **psf/black** (https://github.com/psf/black) — maintained, popular single-purpose CLI; most-modern stack.
  - Backend — `pyproject.toml` `[build-system]` → `hatchling.build`.
  - Layout — src: packages under `src/black/`; wheel maps `only-include = ["src"]`, `sources = ["src"]`.
  - Entry point — `[project.scripts]` → `black = "black:patched_main"`.
  - Tests — top-level `tests/` + `tests/conftest.py`; `[tool.pytest.ini_options]` with `--strict-markers`, `xfail_strict`.
  - Types — `[tool.mypy] strict = true`, ships `src/black/py.typed`.
- **simonw/sqlite-utils** (https://github.com/simonw/sqlite-utils) — maintained, popular small CLI; pragmatic stack.
  - Backend — `setuptools` + PEP 621 `[project]` metadata.
  - Layout — flat: package `sqlite_utils/` at repo root.
  - Entry point — `[project.scripts]` → `sqlite-utils = "sqlite_utils.cli:cli"`.
  - Tests — `tests/` + `tests/conftest.py`, pytest defaults; ships `py.typed` with loose mypy.
- **httpie/cli** (https://github.com/httpie/cli) — the closest structural analog: a large CLI that **shells out to subprocesses**.
  - CLI framework — **argparse** (custom `ParserSpec` in `httpie/cli/definition.py`), proving argparse scales for non-nested CLIs.
  - subprocess discipline — isolates calls in `httpie/internal/daemons.py` (`Popen(..., close_fds=True, shell=False)`) and `httpie/output/ui/man_pages.py` (`subprocess.run(...)`).
  - Tests — `tests/` with `pytest-mock`, `responses`; mocks the boundary, not the network.

**Convergence note:** src-layout + `[project.scripts]` (PEP 621) recurs in the two modern repos (black, sqlite-utils); `tests/` + `conftest.py` + pytest recurs in all three; `py.typed` in the two typed repos. CLI framework splits 2:1 toward Click for *nested* CLIs, but httpie shows argparse is correct for a *single-command* tool like ours. All three still use flake8 — the one axis where they lag 2026 convention (ruff).

**Build vs adopt.** This is structure/packaging, not a feature a library provides, so the plan **adopts conventions** (PyPA layout, hatchling, pytest, ruff) rather than a single library. The one runtime dependency decision: keep shelling out to `yt-dlp` (its CLI is the stable interface; httpie precedent) but **declare `yt-dlp` as a project dependency** so install provides the binary — removing the fragile "must be on PATH already" assumption. Using yt-dlp's Python API instead is explicitly out of scope (couples to its less-stable internal API).

## Skills available to install
Both already installed locally (pre-vetted, no network) — `/implement` should invoke them:
- **codebase-design** (`~/.claude/skills/codebase-design`) — deep-module / seam vocabulary; use it for the Phase 2 module split and the render-vs-write separation.
- **tdd** (`~/.claude/skills/tdd`) — red-green loop; use it in Phase 3 for any behavior added during the pytest migration (write the failing test first).

## Canonical guidance consulted
- **PyPA — src vs flat layout** (https://packaging.python.org/en/latest/discussions/src-layout-vs-flat-layout/) — "The src layout helps prevent accidental usage of the in-development copy of the code… if an import package exists in the current working directory with the same name as an installed import package, the variant from the current working directory will be used." Recommends src; cost is "requires installation… to be able to run its code."
- **PyPA — writing pyproject.toml / creating CLIs** (https://packaging.python.org/en/latest/guides/writing-pyproject-toml/, .../creating-command-line-tools/) — `[project.scripts]` `name = "module:callable"` creates the console command; official example uses src-layout. On backends PyPA is deliberately neutral ("purposefully does not make a blanket recommendation").
- **Astral — uv** (https://docs.astral.sh/uv/guides/projects/) — `uv init/add/run/build`; `uv.lock` is "a cross-platform lockfile… should be checked into version control." uv is a workflow front-end that still invokes a declared build backend.
- **Astral — ruff** (https://docs.astral.sh/ruff/) — "replace Flake8 (plus dozens of plugins), Black, isort, pydocstyle, pyupgrade… 10-100x faster," configured in `[tool.ruff]`.
- **pytest — monkeypatch / fixtures** (https://docs.pytest.org/en/stable/how-to/monkeypatch.html) — for "code which cannot be easily tested such as network access," patch the boundary; `conftest.py` fixtures auto-discovered. Plus `pytest-subprocess` (Simon Willison TIL) for faking `subprocess` against fixture output.
- **Typer / Click** (https://typer.tiangolo.com/alternatives/, https://click.palletsprojects.com/en/stable/why/) — argparse "is sufficient for most needs, but requires a lot of code"; Click/Typer earn their dependency when you add **subcommand nesting**, env-var loading, or shell completion.

## What's good (do not change)
- `~/bin/yt2md:48-79` (`read_cues`, `parse_vtt`) — pure, WebVTT-correct parsing with clean seams; ports verbatim into a `vtt` module.
- `~/bin/yt2md:145-171` (`lang_candidates`) — pure, well-factored priority logic, already unit-tested; no change beyond typing.
- `~/bin/yt2md:126-188` (`probe`, `fetch_tracks`) — subprocess use is already isolated to two functions (matches httpie's boundary discipline); becomes the `youtube` module.
- `~/bin/test_yt2md.py` — 16 real edge-case tests (incl. de-roll, zero-width, language priority); the assertions port directly to pytest.
- Stdlib-only runtime — keep it; do not add runtime deps beyond declaring `yt-dlp`.

## Cleanup phases

### Phase 1: Scaffold an installable package (src-layout + pyproject + hatchling + uv)

**Why.** Not installable/distributable today. PyPA recommends src-layout to avoid the cwd-import footgun and `[project.scripts]` for the console command; black demonstrates the hatchling+src+scripts shape in production.

**Reference pattern.** black `pyproject.toml`:
```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
[tool.hatch.build.targets.wheel]
only-include = ["src"]
sources = ["src"]
```

**Files affected.**
- /Users/edmond/Projects/yt2md/pyproject.toml (new)
- /Users/edmond/Projects/yt2md/src/yt2md/__init__.py (new)
- /Users/edmond/Projects/yt2md/src/yt2md/__main__.py (new)
- /Users/edmond/Projects/yt2md/src/yt2md/cli.py (new — current script lands here verbatim first)
- /Users/edmond/Projects/yt2md/README.md, LICENSE (new)

**Steps.**
1. `cd ~/Projects && uv init --package yt2md --lib` (or `mkdir`+manual), then create the src tree. New git repo (aligns with the 2bTwist open-source goal — flag location in `/grill-me`).
2. Write `pyproject.toml`: `[project]` name/version/`requires-python = ">=3.10"`, `dependencies = ["yt-dlp"]`, `[project.scripts] yt2md = "yt2md.cli:main"`, `[build-system]` hatchling, the wheel `only-include`/`sources` block above.
3. Move the current 259-line script body into `src/yt2md/cli.py` **unchanged** (decomposition is Phase 2); add `src/yt2md/__init__.py` with `__version__` and `src/yt2md/__main__.py` calling `cli.main()`.
4. `uv sync` then smoke test.

**Verification.**
- [x] `uv run yt2md --help` prints usage. (also `python -m yt2md` works; entry point installed at `.venv/bin/yt2md`)
- [x] `uv run yt2md <vtt> -o ...` produces byte-identical transcript body to `~/bin/yt2md` (only the `-o`-derived title line differs).
- [x] `uv build` produces a wheel + sdist in `dist/` (`yt2md-0.1.0-py3-none-any.whl`, `.tar.gz`).

**Effort.** Low-Medium — mechanical scaffolding, no logic change.

**Trigger.** Now.

### Phase 2: Decompose into typed modules; separate rendering from I/O

**Why.** One 259-line `cli.py` fuses parsing, network, rendering, file-writing, and arg-parsing; rendering can't be tested without temp files. codebase-design (deep modules) and PyPA's typed example call for separated, typed modules with `py.typed`.

**Reference pattern.** sqlite-utils splits `sqlite_utils/cli.py` (CLI) from `db.py`/`utils.py` (logic) and ships `py.typed`; black keeps `[tool.mypy] strict = true`.

**Files affected.**
- src/yt2md/vtt.py (new — `read_cues`, `parse_vtt`, `clean_text`, `hms`, `to_secs`, regexes, `Segment` dataclass)
- src/yt2md/render.py (new — `group_paragraphs`, `render_markdown() -> str`, `render_json() -> str`; thin `write_text()` helper)
- src/yt2md/youtube.py (new — `probe`, `lang_candidates`, `fetch_tracks`, `pick_best`)
- src/yt2md/cli.py (slimmed to argparse + orchestration), src/yt2md/py.typed (new, empty)

**Steps.**
1. Invoke **codebase-design** to confirm the seams. Introduce `@dataclass(frozen=True) class Segment: sec: int; hms: str; text: str` and replace the 3-tuples.
2. Split functions into the modules above; `cli.py` imports from them.
3. Refactor `write_markdown`/`write_json` into pure `render_markdown(...) -> str` / `render_json(...) -> str` + a one-line writer in `cli.py`. This is the key testability win.
4. Add type hints throughout; create empty `py.typed`; add `[tool.mypy]` (start `strict = true`, relax per-module only if needed — sqlite-utils precedent).
5. Keep CLI on **argparse** (single-command tool; httpie precedent + Typer/Click decision rule). Isolate it in `cli.py` so a later Typer move is local. (Open decision for `/grill-me`: adopt Typer now for completion/`--help` polish?)

**Verification.**
- [x] `uv run mypy` clean (strict, 6 files).
- [x] Golden-output diff: markdown (para+line) + `--json` byte-identical to the original on the cached `/tmp/yt-test.en.vtt`.
- [x] `python -m yt2md ...` still works.

**Effort.** Medium — most code moves, behavior must stay identical (golden diff guards it).

**Trigger.** After Phase 1.

### Phase 3: Migrate tests to pytest (fixtures + mocked subprocess boundary)

**Why.** The custom `SourceFileLoader` harness is a workaround for an unpackaged script; with a real package, pytest is the convergent standard (all three reference repos). Network/binary calls must be mocked, not invoked.

**Reference pattern.** httpie mocks with `pytest-mock`; pytest docs: patch the boundary via `monkeypatch`; `pytest-subprocess` fakes `subprocess` against canned output.

**Files affected.**
- tests/test_vtt.py, tests/test_render.py, tests/test_youtube.py (new)
- tests/conftest.py, tests/fixtures/*.vtt (new — real captured samples: clean, rolling `-orig`, zero-width, multi-line)
- pyproject.toml (`[tool.pytest.ini_options]`, `[dependency-groups] dev = [...]`)

**Steps.**
1. Port the 16 assert cases into `test_vtt.py`/`test_render.py` as plain pytest functions (drop the loader shim — direct `from yt2md import vtt`).
2. Save the real `/tmp` VTTs as `tests/fixtures/` files; parametrize parsing tests over them.
3. For `youtube.py`, patch `subprocess.run` (via `monkeypatch`/`pytest-subprocess`) to return canned `yt-dlp` stdout + write fixture VTTs into the temp dir; assert `lang_candidates` ordering and `fetch_tracks` fallback **without network**. Use **tdd** (red first) for any new assertion.
4. Add `[tool.pytest.ini_options]` (`testpaths = ["tests"]`, `xfail_strict = true`).

**Verification.**
- [x] `uv run pytest` green — 29 tests (16 parse cases + render + lang-priority + mocked fetch fallback).
- [x] Zero network: 0.04s run; `youtube` tests mock `subprocess.run`, parse/render tests touch no subprocess.

**Effort.** Medium — porting is quick; the subprocess-mock harness is the new work.

**Trigger.** After Phase 2.

### Phase 4: Quality tooling (ruff + mypy config + README/LICENSE)

**Why.** No lint/format/type config today. ruff is the 2026 one-tool replacement for flake8+isort+black+pyupgrade (Astral).

**Files affected.** pyproject.toml (`[tool.ruff]`, `[tool.mypy]`), README.md, LICENSE, src/yt2md/__init__.py (`__version__`).

**Steps.**
1. Add `[tool.ruff]` (line length, select rules); run `uv run ruff format` + `uv run ruff check --fix`.
2. Finalize `[tool.mypy]` strictness.
3. README: install (`uv tool install` / `pipx install`), usage, the `yt-dlp` requirement, `--lang` behavior; choose a LICENSE (MIT — matches the OpenSuperWhisper-style tools and the open-source goal).

**Verification.**
- [x] `uv run ruff check .` and `uv run ruff format --check .` clean.
- [x] `uv run mypy` clean.

**Effort.** Low.

**Trigger.** After Phase 3 (or alongside).

### Phase 5: CI + distribution; retire the loose script

**Why.** No CI; the tool still lives as a loose `~/bin` file. uv documents a GH Actions matrix; PyPA recommends Trusted Publishing for release.

**Files affected.** .github/workflows/ci.yml (new), .github/workflows/release.yml (optional), pyproject.toml (classifiers/urls).

**Steps.**
1. CI: checkout → `astral-sh/setup-uv` → `uv sync` → `uv run ruff check .` → `uv run ruff format --check .` → `uv run mypy src/` → `uv run pytest`, over a Python-version matrix.
2. Replace `~/bin/yt2md` usage with the installed console script: `uv tool install .` (or `pipx install .`) so `yt2md` resolves to the package; delete the loose `~/bin/yt2md` + `~/bin/test_yt2md.py` once parity is confirmed.
3. (Optional) `release.yml` with PyPI Trusted Publishing if publishing; first check the name `yt2md` is free on PyPI.

**Verification.**
- [x] CI workflow written (`.github/workflows/ci.yml`: uv matrix, ruff+format+mypy+pytest); not pushed (local-only per direction).
- [x] `uv tool install` yields a working `yt2md` at `~/.local/bin/yt2md`; loose `~/bin/yt2md` retired. (`~/.local/bin` not yet on PATH — user's call.)

**Effort.** Low-Medium.

**Trigger.** After Phase 4.

### Phase 6: Drive parse→markdown to its speed ceiling (autoresearch + rigor, then compiled)

**Why.** Performance is an explicit goal (decisions 4-5). "Nanoseconds total" is physically impossible — a 20k-word transcript is ~120 KB, so a single scan alone is microseconds — so the metric is **throughput (segments/sec, MB/s) and per-segment latency**, and the target is the achievable floor: the pure-Python ceiling first, then a compiled hot path for ~tens-of-ns/segment. Every claimed win is gated by `rigor` (gate-before / refute-after; Twyman's Law on suspicious speedups) so no fluke survives.

**Reference pattern.** `black` compiles its hot path with mypyc and keeps a pure-Python fallback; alternatively a Rust extension via pyo3 + maturin. Loop driver: the **`autoresearch`** skill (in-harness optimization loop). `pytest-benchmark` for in-process regression detection, stdlib `cProfile` for hotspots, `hyperfine` for end-to-end. (gnhf is an optional alternative driver only if you want an unattended overnight run with a token cap — not installed, not needed here.)

**Files affected.**
- bench/corpus/ (new — diverse captured transcripts spanning the edge cases)
- bench/ (cProfile + hyperfine scripts, recorded baselines, autoresearch config)
- tests/test_perf.py (regression floor) and tests/test_parity.py (pure-vs-compiled golden parity)
- src/yt2md/_accel/ (new — Rust/pyo3 crate or mypyc target) + fallback wiring in vtt.py

**Steps.**
1. **Build a diverse corpus** under `bench/corpus/`: short / long / clean-track / rolling-`-orig` / music (♪) / zero-width / multi-line / non-English, plus a synthetic 10x-scaled (~30k-segment) file simulating a 10-hour lecture. This range is what makes the numbers trustworthy.
2. **Baseline + attribute** with `cProfile` + `pytest-benchmark` across the corpus; record segments/sec and the hot functions (expect the regexes in `clean_text` / `parse_vtt`).
3. **`autoresearch` loop on pure Python** — each iteration: profile → hypothesize one bottleneck fix (fold the 3 cleaning regex passes into one, precompile, stop `pick_best` re-parsing every candidate VTT) → apply → measure. **Gate every kept win with `rigor`** (reproduce from clean; reject noise). Stop at diminishing returns near the Python ceiling (expected ~1-5 ms / 20k words).
4. **Compiled hot path** — port the proven-hottest function(s) to a Rust/pyo3 crate (maturin) or mypyc, behind `try: from . import _accel` with the pure-Python implementation as the always-present fallback. Keep both byte-identical via `tests/test_parity.py` across the whole corpus.
5. **Prove the win with `rigor`** — compiled vs pure across the corpus; report segments/sec and ns/segment, and state explicitly what is NOT measured (network).
6. **Defer distribution** (decision 6): build/bench the extension locally only; no cibuildwheel / GitHub-Releases wheels yet. The pure-Python fallback keeps `pipx install git+...` working without a toolchain meanwhile.

**Verification.**
- [x] `bench/` holds the corpus (clean/rolling/big30k) + `RESULTS.md` baselines (pure + compiled), with metric + not-measured caveat documented.
- [x] `tests/test_perf.py` loose floor (>25k seg/s; we measure >300k pure / >600k compiled) — passes both pure and compiled.
- [x] Parity: full 30-test suite + golden `.md`/`.json` are byte-identical with AND without the `.so` (same source compiled). A separate `test_parity.py` was unnecessary given the suite proves it both ways.
- [x] Rigor write-up: `bench/RESULTS.md` — metric, what's NOT measured (network), ~1400 ns/seg practical floor, and the honest "nanoseconds-per-segment is unreachable here" conclusion.

**Deviation from plan:** used mypyc's same-name `.so` shadowing (ship `vtt.py` + optional compiled `vtt.*.so`) instead of a separate `src/yt2md/_accel/` module — simpler, and it IS the optional-accelerator-with-pure-fallback design. No Rust path (no toolchain); mypyc compiled cleanly on 3.14.

**Effort.** High — the compiled path + parity harness is the bulk; accepted as a big jump for a small absolute win (bragging rights, not user-perceptible).

**Trigger.** After Phase 3 (needs importable functions + the corpus); the compiled sub-step only after the pure-Python ceiling is measured.

## Out of scope
- Rewriting to use the `yt-dlp` **Python API** instead of its CLI — its CLI is the stable contract (httpie precedent); revisit only if subprocess parsing becomes brittle.
- New features (batch URLs, subcommands, playlists, Whisper fallback) — this plan is structure-only; adding subcommands is also the trigger to reconsider Typer.
- Publishing to PyPI, and building/shipping wheels (cibuildwheel, GitHub Releases) — deferred (decisions 1 & 6); the compiled extension is built and benchmarked locally only, with the pure-Python fallback covering installs.
- Migrating CLI to Typer/Click — deferred; argparse is correct for a single-command tool (decision 3). Trigger to revisit: adding a second subcommand.

## Hand-off
Grilling complete — all major branches resolved (see Decisions above).
Next: `/implement specs/plans/2026-06-22-groundwork-yt2md-python-package.md` to execute Phase 1 (scaffold the package).
