# Domain glossary

Terms used when reasoning about this site's structure. Code and reviews use these names.

- **Page**: a public HTML route a visitor can land on: top-level pages, projects, posts,
  legal pages, and tag pages. Feeds, robots, APIs, and downloads are not pages.
- **Page catalogue**: the one server module that knows every page and its flags. Every
  route list (explorer tree, tabs, palette, terminal, sitemap, phone nav, split panes) is
  a view of it. Top-level pages are declared in `data/pages.ts`; projects and posts
  expand from their own data.
- **Catalogue view**: the serialisable slice of the catalogue that the browser receives:
  the client-importable pages and projects by default, plus posts and tags from the root
  layout.
- **Tree placement**: where a page sits in the explorer tree, if anywhere. Pages without
  one (legal, tag, resume) still get tabs and labels.
- **Compact nav**: the phone and no-JS header nav. A declared subset of pages, in a
  declared order.
- **Indexable page**: a page listed in the sitemap. Pages are indexable unless they opt
  out.
