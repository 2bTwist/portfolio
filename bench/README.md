# Microbenchmarks (tachometer)

The function/CPU layer (grilled decision 3 — the sub-µs/ns regime). We use
[`google/tachometer`](https://github.com/google/tachometer): it repeats sampling
until a **95% confidence interval** proves A vs B actually differ, which is the
correct answer to "is this faster, or is it noise?" (the cn-vs-cnfast question).

## Run an A/B

```sh
npx tachometer bench/example-a.html bench/example-b.html
```

Each benchmark HTML sets `window.tachometerResult` to the elapsed ms it wants
measured. tachometer reports each variant with a confidence interval and tells
you whether the difference is statistically significant.

## When to add a bench

Only for a **provably hot** function (one called many times per frame). Do not
benchmark cold code — it adds noise, not signal. First candidate: the animation
loop in `cn-explainer.html`.
