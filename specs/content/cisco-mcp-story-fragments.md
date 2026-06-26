# Cisco MCP — story fragments (explore pile)

The first internal MCP platform at Cisco. Built it from nothing, came back to make it fast.

---

Structure Edmond wants (his words): what MCP is · how it was for me given I knew nothing about it · high level, what was the problem · what was the challenge · how we solved it · issues along the way · lessons learned · conclusion.

---

What it became (from the resume / experience timeline): a decoupled FastAPI and FastMCP server that let AI agents discover and call internal tools on their own; a Vue dashboard where 20+ engineers could onboard and manage 15+ tools; an in-browser agent client to test them. It replaced a lot of manual wiring and tool-by-tool checking.

---

Who used it: developers on Cisco's Finance IT team, for internal tooling. 5+ engineering teams came to lean on it.

---

Two stints. Jun–Aug 2025: built the first version. Sep–Nov 2025: came back to own the platform I'd helped build, this time focused on making it fast and dependable — profiled the frontend and cut interaction latency by ~40%, brought recurring production incidents down ~35% so it stayed steady for the teams relying on it.

---

I didn't first hear "MCP" at Cisco. I kept up with AI trends, so I'd seen it. The one time I'd actually used it: the early days, when you could connect your AI agent to your file system over MCP and it could move files around your computer for you. That was a big deal at the time. (It's all moved on since.)

---

But I'd only ever hooked it up and played. Never built one. Never even wanted to know how it worked under the hood — I just used it.

---

Then I get to Cisco and I'm told I'll be working with the team building the MCP server. And it's like: damn, okay, we're going right in. I was half-expecting something familiar — a CRUD app, something I'd done before. Instead it's something new. (I keep asking myself: how is it always something new?)

---

What MCP actually is (VERIFIED): the Model Context Protocol is an open standard Anthropic released on Nov 25 2024 for connecting AI applications to external tools and data through one protocol. Think of it as a universal port: instead of hand-wiring every agent to every tool, a tool exposes itself once via an MCP server, and any MCP-speaking app can discover and call it. Architecture: the AI app is the HOST; it spins up one MCP CLIENT per server connection; each MCP SERVER exposes three things — tools (functions it can run), resources (context data), and prompts (templates). [Keep "client" plural-aware: one client per server, not "the client".]

---

First move, like every project I do: get hands on. Set it up at the barest-minimum level just to understand it. I did this at night. My team had already started building, but — truthfully — most of them didn't really know how it worked either. Which was weirdly reassuring: okay, nobody fully gets this yet.

---

I asked the team what they used to get up to speed, and found a good YouTube video — Tech With Tim (https://www.youtube.com/watch?v=-8k9lGpGQ6g&t=598s) — and spent the whole night on it. One of my things: I did not want to be behind. I wanted to be fully part of the team. So I set myself a goal: by the end of the week, build my own fully functional, very minimal MCP server.

---

That's when it clicked how powerful this is. Before, with an AI agent you just prompt it. Here you give it a box of tools — each one already does a set thing — and the agent figures out which tool fits the scenario. Each tool carries a description and little hints to help the agent choose. You're not telling it what to do step by step; you're handing it capabilities and letting it decide.

---

The problem, and I want to be fair: this isn't really a Cisco problem. It's one every company and every team has. Inside Cisco there's a huge amount of internal tooling — everyone's written their own scripts, tools, APIs for the finance team's day-to-day. Want to pull something off a dashboard? Call a certain API. Want metrics from a specific database? There's a tool for that. Everyone had built their own.

---

The pain is discovery and access. As someone inside Cisco you can't easily find these tools, because (1) there's no marketplace — you don't know what exists, and (2) you don't know how to find it, who owns it, which team built it.

---

So the old way: to find a tool for some system, you reach out to a team, and that team asks around. Sometimes nobody's built it. Sometimes two teams have built the same tool with the same functionality, not knowing about each other. It was a mess.

---

So the goal wasn't really "an MCP server" — those are honestly easy to build. It was an MCP **marketplace**. That distinction is the whole challenge: I didn't just have to learn MCP, I had to make MCP work at enterprise level. Out of the box MCP is a simple monolith app — you can't do certain things with it that an enterprise needs.

---

The shape of it: Cisco is very AI-first, everyone uses AI agents to do tasks and write code. We wanted every agent to connect to the marketplace and get context on the tools available to their team / department / the company, then call them. In MCP terms there's a client and a server — the AI agents (Copilot, whatever you use) are the clients; we're the server they connect to.

---

The flow we were building: you ask your agent to pull something. The agent queries the marketplace, sees what's available, and we respond with the tool and the tool call to perform. And it's not enough to find the tool — the agent also has to discover, from the tool, how to format the request so it can actually use it.

---

The grunt work underneath all of it: onboarding tools. Making sure the schemas are right. The validations to confirm endpoints actually work and the OpenAPI schema is actually correct. Unglamorous, but it's what makes a marketplace trustworthy.

---

The finance team asked us to build it. We had about two months. "We" was small: me and my mentor.

---

The decoupling: I'd never decoupled anything before. I didn't even know what the word meant. My mentor said it and I literally went "what does that even mean?" Turns out it means separating the API layer from the MCP layer. (VERIFIED framing: the FastAPI side owns the REST backend — the dashboard, the tool registry, onboarding, auth, generating OpenAPI schemas; the FastMCP side owns speaking the MCP protocol to agents. FastMCP CAN be mounted right inside a FastAPI app, so "decoupled" means a clean module + deploy boundary you can scale and ship independently, NOT that they can't co-exist. Bonus accurate point: a curated MCP server beats a 1:1 auto-mirror of your whole REST API — another reason to treat the MCP layer as its own designed thing.)

---

Onboarding was a major part. The first version was painful: you'd reach out, request an API key, then use it through your terminal — some CLI and config. Nobody liked onboarding a tool that way.

---

So I built a dashboard in Vue to do it — had to follow Cisco's internal UI library. It's the front of the marketplace: see every tool other people have onboarded, see each tool's scope / which department it's for (so you can't run a tool that isn't yours to run), see whether a tool is active and properly set up.

---

The clever bit of the dashboard: onboarding your own tool. You paste in your API URL, and the dashboard queries that API and automatically generates the OpenAPI schema for you — shaped so the AI agents can actually understand it. A lot of work went into making onboarding that smooth. That was my work: the server, the dashboard, the front end. Full stack.

---

Hardest thing to get right? The decoupling — I couldn't wrap my head around it at first, then once it clicked it was almost easy. But the honest hardest part was just understanding the code. There was so much of it; most of the time I didn't know what was happening. We made it work anyway.

---

Enterprise reality, and no shade to Cisco — genuinely a good team, very good at what they do — but requesting access to things is jarring. So many of my bottlenecks were just waiting on access. That's normal when you scale up; nothing anyone can do about it. I learned to just understand it.

---

Their deployment pipeline was also something I'd never done before — a whole new way of getting code out. (Again: something new.)

---

A big chunk of the work was just trying and testing whether the model could actually use a tool properly. Models were not as good then as they are now. Tool calling was bad enough that you had to be extremely explicit in your tool descriptions and definitions about what exactly a tool does. The one thing they were great at was reading OpenAPI schemas — but they'd hallucinate constantly. We got it to a point where it worked pretty well.

---

Why the in-browser client: when you onboard a tool, to actually test it you'd normally have to configure the MCP server in your editor (VS Code is both the client and the agent), then leave the dashboard, go set it up in VS Code, and test there. That works, but it's friction — what if you just want to test it right here? So we built an in-browser AI agent, basically a chatbot. Sounds simple; at the time it felt complicated to me. Its whole job: act as an MCP client so you can test a tool right from the browser.

---

[STRUCTURE NOTE: this is too long for one page. Split into TWO linked parts. Part 1 = building it (first stint: knew nothing → learned MCP → the marketplace, decoupling, Vue dashboard, in-browser client). Part 2 = the return (adoption, the cleanup, the maintenance lesson). End of Part 1 links with an arrow to Part 2.]

[VERIFY-AT-END NOTE: Edmond asked me to fact-check and tighten the technical claims (MCP, client/server, decoupling, FastAPI/FastMCP, OpenAPI) so they're accurate — he says his spoken version isn't precise. Do a real verification pass during shaping. Also: do NOT add a "where is it now" status — he's unsure; he thinks they're probably still using it but doesn't want that claimed.]

=== PART 2: THE RETURN (Sep–Nov 2025) ===

---

When I went back in September, I honestly didn't think it would get adopted. Then I saw one of those company-wide emails — the kind sent to everyone about the big things being built — and it was in there as a major thing. I had no idea it had gotten that big. I was so proud I'd worked on it. It was funny to me: I didn't think an intern could ship work that people would actually notice and use, that it'd be a real thing.

---

And then people started using it, and it was breaking. The code was horrible, honestly. When I first wrote it I thought I'd done a good job. I came back, looked at it, and went: what the heck was I doing?

---

Concretely, the front end: nothing was lazy-loading. A table meant to hold a ton of entries had no pagination, no lazy loading, no limit. Pages weren't rendering right, things were poorly aligned. It looked so ugly — I couldn't believe that was what I'd shipped.

---

So the return was cleanup: splitting things into proper components, paginating and lazy-loading the heavy table, cleaning up the backend/server, restructuring the files and the architecture so it was actually organized. [This cleanup is what the resume's numbers come from: ~40% lower interaction latency, ~35% fewer recurring incidents. Ground the numbers in the concrete work — pagination/lazy-loading for latency, restructure + fixing tool failures for incidents — not vague "profiling."]

---

And the day-to-day: someone would hit an issue, a tool not working, and my mentor and I would figure it out. Honestly the return wasn't as fun as the first time. The first time was learning; this was "okay, you gotta clean up now, arrange stuff." Some challenging nights, but it wasn't some crazy heroic thing — I won't pretend it was.

---

The lesson that stuck: most of a developer's work isn't writing new stuff. It's maintaining the old stuff. Yes, you write the code — but can you maintain it? Can you fix it? Can you handle the issues that come up? That's the job.

---

What I'm proud of, the conclusion: (1) I shipped a full project that was not only good but actually adopted and useful. (2) I picked up a brand-new technology that fast — it told me my fundamentals are solid enough to learn things quickly. That made me genuinely happy.
